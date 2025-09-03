import * as vscode from 'vscode';
import { SemanticProtocol } from '@kneelinghorse/semantic-protocol';

export class SemanticCompletionProvider implements vscode.CompletionItemProvider {
    private protocol = new SemanticProtocol();

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        const items: vscode.CompletionItem[] = [];
        const line = document.lineAt(position);
        const lineText = line.text.substring(0, position.character);

        // Check context
        if (this.isInManifest(document, position)) {
            items.push(...this.getManifestCompletions(lineText));
        } else if (this.isInSemanticFunction(lineText)) {
            items.push(...this.getSemanticFunctionCompletions());
        } else if (this.isInJSX(document, position)) {
            items.push(...this.getJSXCompletions());
        }

        return items;
    }

    private isInManifest(document: vscode.TextDocument, position: vscode.Position): boolean {
        const text = document.getText();
        const offset = document.offsetAt(position);
        
        // Simple check - in real implementation would use proper AST parsing
        const beforeText = text.substring(Math.max(0, offset - 100), offset);
        return beforeText.includes('manifest') || 
               beforeText.includes('getManifest') ||
               document.fileName.endsWith('.semantic.json');
    }

    private isInSemanticFunction(lineText: string): boolean {
        return lineText.includes('useSemantics') ||
               lineText.includes('SemanticProtocol') ||
               lineText.includes('semantic.');
    }

    private isInJSX(document: vscode.TextDocument, position: vscode.Position): boolean {
        const text = document.getText();
        const offset = document.offsetAt(position);
        const beforeText = text.substring(Math.max(0, offset - 50), offset);
        return beforeText.includes('<') && !beforeText.includes('>');
    }

    private getManifestCompletions(lineText: string): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];

        // Element type completions
        if (lineText.includes('"type"')) {
            const types = ['action', 'display', 'input', 'container', 'navigation'];
            types.forEach(type => {
                const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.EnumMember);
                item.detail = `Element type: ${type}`;
                item.documentation = new vscode.MarkdownString(this.getTypeDocumentation(type));
                item.insertText = `"${type}"`;
                items.push(item);
            });
        }

        // Intent completions
        if (lineText.includes('"intent"')) {
            const intents = ['submit', 'cancel', 'navigate', 'display', 'collect', 'validate'];
            intents.forEach(intent => {
                const item = new vscode.CompletionItem(intent, vscode.CompletionItemKind.EnumMember);
                item.detail = `Element intent: ${intent}`;
                item.insertText = `"${intent}"`;
                items.push(item);
            });
        }

        // Criticality completions
        if (lineText.includes('"criticality"')) {
            const levels = ['low', 'medium', 'high', 'critical'];
            levels.forEach(level => {
                const item = new vscode.CompletionItem(level, vscode.CompletionItemKind.EnumMember);
                item.detail = `Criticality level: ${level}`;
                item.insertText = `"${level}"`;
                items.push(item);
            });
        }

        // Manifest structure completions
        if (lineText.match(/^\s*"?$/)) {
            const properties = [
                { name: 'protocol', kind: vscode.CompletionItemKind.Property, value: '"semantic-ui/v2"' },
                { name: 'element', kind: vscode.CompletionItemKind.Property, value: '{\n  "type": "$1",\n  "intent": "$2"\n}' },
                { name: 'context', kind: vscode.CompletionItemKind.Property, value: '{\n  "flow": "$1",\n  "step": $2\n}' },
                { name: 'relationships', kind: vscode.CompletionItemKind.Property, value: '{\n  "parent": "$1",\n  "children": [$2]\n}' },
                { name: 'validation', kind: vscode.CompletionItemKind.Property, value: '{\n  "rules": [$1],\n  "messages": {$2}\n}' },
                { name: 'metadata', kind: vscode.CompletionItemKind.Property, value: '{\n  "version": "$1",\n  "tags": [$2]\n}' }
            ];

            properties.forEach(prop => {
                const item = new vscode.CompletionItem(prop.name, prop.kind);
                item.detail = `Manifest property: ${prop.name}`;
                item.insertText = new vscode.SnippetString(`"${prop.name}": ${prop.value}`);
                item.documentation = new vscode.MarkdownString(this.getPropertyDocumentation(prop.name));
                items.push(item);
            });
        }

        return items;
    }

    private getSemanticFunctionCompletions(): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];

        // React hooks
        const hooks = [
            { name: 'useSemantics', params: '({ manifest: $1 })' },
            { name: 'useDiscovery', params: '({ query: $1 })' },
            { name: 'useRelationships', params: '({ componentId: $1 })' }
        ];

        hooks.forEach(hook => {
            const item = new vscode.CompletionItem(hook.name, vscode.CompletionItemKind.Function);
            item.detail = `Semantic hook: ${hook.name}`;
            item.insertText = new vscode.SnippetString(`${hook.name}${hook.params}`);
            item.documentation = new vscode.MarkdownString(this.getHookDocumentation(hook.name));
            items.push(item);
        });

        // Protocol methods
        const methods = [
            { name: 'validate', params: '($1)' },
            { name: 'register', params: '($1)' },
            { name: 'discover', params: '({ type: "$1" })' },
            { name: 'analyze', params: '($1)' }
        ];

        methods.forEach(method => {
            const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
            item.detail = `Protocol method: ${method.name}`;
            item.insertText = new vscode.SnippetString(`${method.name}${method.params}`);
            items.push(item);
        });

        return items;
    }

    private getJSXCompletions(): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];

        // Semantic components
        const components = [
            { name: 'SemanticProvider', props: '' },
            { name: 'SemanticBoundary', props: ' fallback={$1}' },
            { name: 'SemanticPortal', props: ' targetId="$1"' }
        ];

        components.forEach(comp => {
            const item = new vscode.CompletionItem(comp.name, vscode.CompletionItemKind.Class);
            item.detail = `Semantic component: ${comp.name}`;
            item.insertText = new vscode.SnippetString(`${comp.name}${comp.props}>$0</${comp.name}>`);
            items.push(item);
        });

        // Semantic attributes
        const attributes = [
            { name: 'data-semantic-id', value: '"$1"' },
            { name: 'data-semantic-type', value: '"$1"' },
            { name: 'data-semantic-intent', value: '"$1"' }
        ];

        attributes.forEach(attr => {
            const item = new vscode.CompletionItem(attr.name, vscode.CompletionItemKind.Property);
            item.detail = 'Semantic attribute';
            item.insertText = new vscode.SnippetString(`${attr.name}=${attr.value}`);
            items.push(item);
        });

        return items;
    }

    private getTypeDocumentation(type: string): string {
        const docs: Record<string, string> = {
            'action': 'Triggers user actions (buttons, links)',
            'display': 'Shows information (text, images, data)',
            'input': 'Collects user input (forms, fields)',
            'container': 'Groups other elements (sections, cards)',
            'navigation': 'Enables navigation (menus, breadcrumbs)'
        };
        return docs[type] || '';
    }

    private getPropertyDocumentation(property: string): string {
        const docs: Record<string, string> = {
            'protocol': 'The semantic protocol version',
            'element': 'Defines the element type and behavior',
            'context': 'Describes the element\'s context and flow',
            'relationships': 'Defines relationships with other components',
            'validation': 'Validation rules and error messages',
            'metadata': 'Additional metadata and tags'
        };
        return docs[property] || '';
    }

    private getHookDocumentation(hook: string): string {
        const docs: Record<string, string> = {
            'useSemantics': 'React hook for attaching semantic manifests to components',
            'useDiscovery': 'React hook for discovering components by semantic query',
            'useRelationships': 'React hook for managing component relationships'
        };
        return docs[hook] || '';
    }
}