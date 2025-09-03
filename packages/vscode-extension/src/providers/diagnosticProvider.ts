import * as vscode from 'vscode';
import { SemanticProtocol, SemanticManifest } from '@kneelinghorse/semantic-protocol';

export class SemanticDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private protocol = new SemanticProtocol();

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('semantic-protocol');
    }

    async validate(document: vscode.TextDocument): Promise<void> {
        if (!this.shouldValidate(document)) {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        // Extract manifests from document
        const manifests = this.extractManifests(text, document);

        // Validate each manifest
        for (const { manifest, range, line } of manifests) {
            const issues = await this.validateManifest(manifest);
            
            issues.forEach(issue => {
                const diagnostic = new vscode.Diagnostic(
                    issue.range || range,
                    issue.message,
                    issue.severity
                );
                
                diagnostic.code = issue.code;
                diagnostic.source = 'semantic-protocol';
                
                if (issue.fixes) {
                    // Store fixes for code action provider
                    (diagnostic as any).fixes = issue.fixes;
                }
                
                diagnostics.push(diagnostic);
            });
        }

        // Check for missing semantics
        const missingSemantics = this.checkMissingSemantics(text, document);
        diagnostics.push(...missingSemantics);

        // Check for relationship issues
        const relationshipIssues = this.checkRelationships(manifests, document);
        diagnostics.push(...relationshipIssues);

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private shouldValidate(document: vscode.TextDocument): boolean {
        const config = vscode.workspace.getConfiguration('semantic-protocol');
        if (!config.get('validation.enable')) {
            return false;
        }

        // Check if file should be validated
        const fileName = document.fileName;
        return fileName.endsWith('.js') ||
               fileName.endsWith('.jsx') ||
               fileName.endsWith('.ts') ||
               fileName.endsWith('.tsx') ||
               fileName.endsWith('.vue') ||
               fileName.endsWith('.json');
    }

    private extractManifests(text: string, document: vscode.TextDocument): Array<{
        manifest: SemanticManifest;
        range: vscode.Range;
        line: number;
    }> {
        const manifests: Array<any> = [];

        // For JSON files
        if (document.fileName.endsWith('.json')) {
            try {
                const json = JSON.parse(text);
                if (this.isSemanticManifest(json)) {
                    manifests.push({
                        manifest: json,
                        range: new vscode.Range(0, 0, document.lineCount - 1, 0),
                        line: 0
                    });
                }
            } catch (error) {
                // JSON parse error - will be handled by VS Code's built-in JSON validation
            }
            return manifests;
        }

        // For JavaScript/TypeScript files
        const patterns = [
            // getManifest() method
            /getManifest\s*\(\s*\)\s*{\s*return\s*({[\s\S]*?});/g,
            // manifest property
            /manifest\s*[:=]\s*({[\s\S]*?});/g,
            // useSemantics hook
            /useSemantics\s*\(\s*{\s*manifest:\s*({[\s\S]*?})\s*}\s*\)/g,
            // Direct object with protocol field
            /const\s+\w+\s*=\s*({[\s\S]*?protocol\s*:[\s\S]*?});/g
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                try {
                    const manifestStr = match[1] || match[0];
                    const cleanStr = this.cleanManifestString(manifestStr);
                    
                    // Try to parse as JSON-like object
                    const manifest = this.parseManifestString(cleanStr);
                    
                    if (manifest && this.isSemanticManifest(manifest)) {
                        const startPos = document.positionAt(match.index);
                        const endPos = document.positionAt(match.index + match[0].length);
                        
                        manifests.push({
                            manifest,
                            range: new vscode.Range(startPos, endPos),
                            line: startPos.line
                        });
                    }
                } catch (error) {
                    // Ignore parse errors for now
                }
            }
        });

        return manifests;
    }

    private cleanManifestString(str: string): string {
        return str
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*/g, '') // Remove line comments
            .replace(/(['"])([^'"]+)\1:/g, '"$2":') // Quote keys
            .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
            .replace(/undefined/g, 'null'); // Replace undefined with null
    }

    private parseManifestString(str: string): any {
        try {
            // First try direct JSON parse
            return JSON.parse(str);
        } catch {
            try {
                // Try eval with safety measures
                const func = new Function('return ' + str);
                return func();
            } catch {
                return null;
            }
        }
    }

    private isSemanticManifest(obj: any): boolean {
        return obj && 
               typeof obj === 'object' &&
               (obj.protocol || obj.element || obj.manifest);
    }

    private async validateManifest(manifest: SemanticManifest): Promise<Array<{
        message: string;
        severity: vscode.DiagnosticSeverity;
        range?: vscode.Range;
        code?: string;
        fixes?: any[];
    }>> {
        const issues: Array<any> = [];
        const config = vscode.workspace.getConfiguration('semantic-protocol');
        const mode = config.get('validation.mode', 'strict');

        // Validate with protocol
        const result = await this.protocol.validate(manifest);
        
        if (!result.valid && result.errors) {
            result.errors.forEach(error => {
                issues.push({
                    message: error,
                    severity: mode === 'strict' 
                        ? vscode.DiagnosticSeverity.Error 
                        : vscode.DiagnosticSeverity.Warning,
                    code: 'invalid-manifest'
                });
            });
        }

        // Check required fields
        if (!manifest.element?.type) {
            issues.push({
                message: 'Missing required field: element.type',
                severity: vscode.DiagnosticSeverity.Error,
                code: 'missing-type',
                fixes: [{
                    title: 'Add element type',
                    edit: { element: { type: 'action' } }
                }]
            });
        }

        // Check for deprecated fields
        if ((manifest as any).deprecated) {
            issues.push({
                message: 'Using deprecated field: deprecated',
                severity: vscode.DiagnosticSeverity.Warning,
                code: 'deprecated-field',
                fixes: [{
                    title: 'Remove deprecated field',
                    remove: ['deprecated']
                }]
            });
        }

        // Check naming conventions
        if (manifest.element?.type && !/^[a-z-]+$/.test(manifest.element.type)) {
            issues.push({
                message: `Invalid element type format: ${manifest.element.type}. Use lowercase with hyphens.`,
                severity: vscode.DiagnosticSeverity.Warning,
                code: 'naming-convention',
                fixes: [{
                    title: 'Fix naming convention',
                    edit: { 
                        element: { 
                            type: manifest.element.type.toLowerCase().replace(/[A-Z]/g, '-$&') 
                        }
                    }
                }]
            });
        }

        return issues;
    }

    private checkMissingSemantics(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const config = vscode.workspace.getConfiguration('semantic-protocol');
        
        if (config.get('validation.mode') === 'none') {
            return diagnostics;
        }

        // Check for components without semantic manifests
        const componentPatterns = [
            /class\s+(\w+)\s+extends\s+(React\.)?Component/g,
            /function\s+(\w+)\s*\([^)]*\)\s*{[\s\S]*?return\s*\(/g,
            /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*[({]/g,
            /export\s+default\s+function\s+(\w+)/g
        ];

        componentPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const componentName = match[1];
                
                // Check if this component has semantics
                if (!text.includes(`useSemantics`) && 
                    !text.includes(`getManifest`) &&
                    !text.includes(`semantic-${componentName.toLowerCase()}`)) {
                    
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + componentName.length);
                    
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(startPos, endPos),
                        `Component '${componentName}' is missing semantic manifest`,
                        vscode.DiagnosticSeverity.Information
                    );
                    
                    diagnostic.code = 'missing-semantics';
                    diagnostic.source = 'semantic-protocol';
                    
                    diagnostics.push(diagnostic);
                }
            }
        });

        return diagnostics;
    }

    private checkRelationships(manifests: Array<any>, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        
        // Check for circular dependencies
        manifests.forEach(({ manifest, range }) => {
            if (manifest.relationships) {
                const deps = [
                    ...(manifest.relationships.dependencies || []),
                    ...(manifest.relationships.children || [])
                ];
                
                // Simple check - in real implementation would need graph traversal
                if (manifest.metadata?.id && deps.includes(manifest.metadata.id)) {
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        'Circular dependency detected',
                        vscode.DiagnosticSeverity.Error
                    );
                    
                    diagnostic.code = 'circular-dependency';
                    diagnostic.source = 'semantic-protocol';
                    
                    diagnostics.push(diagnostic);
                }
            }
        });

        return diagnostics;
    }

    public clear(): void {
        this.diagnosticCollection.clear();
    }

    public delete(uri: vscode.Uri): void {
        this.diagnosticCollection.delete(uri);
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }

    public getDiagnostics(uri: vscode.Uri): readonly vscode.Diagnostic[] {
        return this.diagnosticCollection.get(uri) || [];
    }
}