// Quick test to verify the package works
try {
    const SemanticProtocol = require('@kneelinghorse/semantic-protocol');
    const protocol = new SemanticProtocol();
    console.log('✅ Package loaded successfully!');
    console.log('📦 Version:', protocol.version);
    
    // Quick functionality test
    const manifest = protocol.createManifest({
        type: 'button',
        role: 'action',
        intent: 'submit',
        category: 'interaction',
        purpose: 'Submit the form',
        domain: 'test',
        flow: 'test-flow',
        step: 1
    });
    
    console.log('✅ Manifest created:', manifest.id);
    console.log('\n🎉 Everything works! Ready to publish.\n');
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
