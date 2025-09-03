import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { SemanticCompletionProvider } from './providers/completionProvider';
import { SemanticHoverProvider } from './providers/hoverProvider';
import { SemanticCodeActionProvider } from './providers/codeActionProvider';
import { SemanticCodeLensProvider } from './providers/codeLensProvider';
import { SemanticDefinitionProvider } from './providers/definitionProvider';
import { SemanticTreeDataProvider } from './providers/treeDataProvider';
import { registerCommands } from './commands';
import { SemanticDiagnosticProvider } from './providers/diagnosticProvider';
import { SemanticVisualizationPanel } from './webview/visualizationPanel';

let client: LanguageClient;
let diagnosticProvider: SemanticDiagnosticProvider;
let visualizationPanel: SemanticVisualizationPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Semantic Protocol extension is activating...');

    // Check if extension is enabled
    const config = vscode.workspace.getConfiguration('semantic-protocol');
    if (!config.get('enable')) {
        console.log('Semantic Protocol extension is disabled');
        return;
    }

    // Initialize diagnostic provider
    diagnosticProvider = new SemanticDiagnosticProvider();
    context.subscriptions.push(diagnosticProvider);

    // Start language server
    startLanguageServer(context);

    // Register providers
    registerProviders(context);

    // Register commands
    registerCommands(context, diagnosticProvider);

    // Register tree view
    const treeDataProvider = new SemanticTreeDataProvider(context);
    vscode.window.createTreeView('semanticComponents', {
        treeDataProvider,
        showCollapseAll: true
    });

    // Watch for configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('semantic-protocol')) {
            handleConfigurationChange();
        }
    });

    // Watch for file changes
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{json,js,jsx,ts,tsx,vue}');
    fileWatcher.onDidChange(uri => validateDocument(uri));
    fileWatcher.onDidCreate(uri => validateDocument(uri));
    fileWatcher.onDidDelete(uri => diagnosticProvider.delete(uri));
    context.subscriptions.push(fileWatcher);

    // Validate all open documents
    vscode.workspace.textDocuments.forEach(document => {
        validateDocument(document.uri);
    });

    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(symbol-class) Semantic';
    statusBarItem.tooltip = 'Semantic Protocol is active';
    statusBarItem.command = 'semantic-protocol.showVisualization';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    console.log('Semantic Protocol extension activated successfully');
}

function startLanguageServer(context: vscode.ExtensionContext) {
    const serverModule = context.asAbsolutePath(
        path.join('out', 'language', 'server.js')
    );

    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'javascript' },
            { scheme: 'file', language: 'javascriptreact' },
            { scheme: 'file', language: 'typescript' },
            { scheme: 'file', language: 'typescriptreact' },
            { scheme: 'file', language: 'vue' },
            { scheme: 'file', language: 'json', pattern: '**/*.semantic.json' },
            { scheme: 'file', language: 'semantic-manifest' }
        ],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.semanticrc.json')
        },
        diagnosticCollectionName: 'semantic-protocol',
        initializationOptions: {
            config: vscode.workspace.getConfiguration('semantic-protocol')
        }
    };

    client = new LanguageClient(
        'semantic-protocol',
        'Semantic Protocol Language Server',
        serverOptions,
        clientOptions
    );

    client.start();
}

function registerProviders(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('semantic-protocol');

    // Completion provider
    if (config.get('autocomplete.enable')) {
        const completionProvider = new SemanticCompletionProvider();
        context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(
                [
                    { language: 'javascript' },
                    { language: 'javascriptreact' },
                    { language: 'typescript' },
                    { language: 'typescriptreact' },
                    { language: 'vue' },
                    { language: 'semantic-manifest' }
                ],
                completionProvider,
                '.',
                '"',
                ':'
            )
        );
    }

    // Hover provider
    if (config.get('hover.enable')) {
        const hoverProvider = new SemanticHoverProvider();
        context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                [
                    { language: 'javascript' },
                    { language: 'javascriptreact' },
                    { language: 'typescript' },
                    { language: 'typescriptreact' },
                    { language: 'vue' },
                    { language: 'semantic-manifest' }
                ],
                hoverProvider
            )
        );
    }

    // Code action provider
    const codeActionProvider = new SemanticCodeActionProvider(diagnosticProvider);
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            [
                { language: 'javascript' },
                { language: 'javascriptreact' },
                { language: 'typescript' },
                { language: 'typescriptreact' },
                { language: 'vue' },
                { language: 'semantic-manifest' }
            ],
            codeActionProvider,
            {
                providedCodeActionKinds: [
                    vscode.CodeActionKind.QuickFix,
                    vscode.CodeActionKind.RefactorRewrite
                ]
            }
        )
    );

    // Code lens provider
    if (config.get('codeLens.enable')) {
        const codeLensProvider = new SemanticCodeLensProvider();
        context.subscriptions.push(
            vscode.languages.registerCodeLensProvider(
                [
                    { language: 'javascript' },
                    { language: 'javascriptreact' },
                    { language: 'typescript' },
                    { language: 'typescriptreact' },
                    { language: 'vue' }
                ],
                codeLensProvider
            )
        );
    }

    // Definition provider
    const definitionProvider = new SemanticDefinitionProvider();
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            [
                { language: 'javascript' },
                { language: 'javascriptreact' },
                { language: 'typescript' },
                { language: 'typescriptreact' },
                { language: 'vue' }
            ],
            definitionProvider
        )
    );

    // Document formatting
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            { language: 'semantic-manifest' },
            {
                provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                    const text = document.getText();
                    try {
                        const json = JSON.parse(text);
                        const formatted = JSON.stringify(json, null, 2);
                        const fullRange = new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(text.length)
                        );
                        return [vscode.TextEdit.replace(fullRange, formatted)];
                    } catch {
                        return [];
                    }
                }
            }
        )
    );
}

async function validateDocument(uri: vscode.Uri) {
    const config = vscode.workspace.getConfiguration('semantic-protocol');
    if (!config.get('validation.enable')) {
        return;
    }

    const document = await vscode.workspace.openTextDocument(uri);
    
    // Skip if not a relevant file
    const relevantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.json'];
    if (!relevantExtensions.some(ext => document.fileName.endsWith(ext))) {
        return;
    }

    // Perform validation
    diagnosticProvider.validate(document);
}

function handleConfigurationChange() {
    const config = vscode.workspace.getConfiguration('semantic-protocol');
    
    // Restart language server if needed
    if (client) {
        client.sendNotification('workspace/didChangeConfiguration', {
            settings: config
        });
    }

    // Re-validate all documents
    if (config.get('validation.enable')) {
        vscode.workspace.textDocuments.forEach(document => {
            validateDocument(document.uri);
        });
    } else {
        diagnosticProvider.clear();
    }
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}