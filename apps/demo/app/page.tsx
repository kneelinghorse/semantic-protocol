import { SemanticProtocol } from '@kneelinghorse/semantic-protocol'

export default function Home() {
  // Demo data
  const fields = [
    { name: 'user_email', type: 'string' as const },
    { name: 'account_balance', type: 'decimal' as const },
    { name: 'is_premium', type: 'boolean' as const },
    { name: 'cancelled_at', type: 'timestamp' as const },
    { name: 'subscription_price', type: 'decimal' as const },
    { name: 'error_count', type: 'integer' as const },
    { name: 'profile_url', type: 'string' as const },
    { name: 'last_payment_at', type: 'timestamp' as const },
    { name: 'discount_percentage', type: 'float' as const },
  ]

  const protocol = new SemanticProtocol()
  const results = fields.map(field => protocol.analyze(field, 'list'))

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Semantic Protocol Demo
        </h1>
        <p className="text-gray-600">
          Automatic semantic understanding of data fields
        </p>
        <div className="flex gap-4 mt-4">
          <a 
            href="https://www.npmjs.com/package/@kneelinghorse/semantic-protocol"
            className="text-blue-600 hover:underline"
          >
            npm: semantic-protocol
          </a>
          <a 
            href="https://www.npmjs.com/package/@kneelinghorse/prisma-semantic-generator"
            className="text-blue-600 hover:underline"
          >
            npm: prisma-generator
          </a>
          <a 
            href="https://github.com/kneelinghorse/semantic-protocol"
            className="text-blue-600 hover:underline"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-8">
        <p className="text-sm">
          <strong>What&apos;s happening?</strong> The Semantic Protocol analyzes field names and types
          to understand what they mean and how they should be displayed. No manual decisions needed!
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Field Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detected Semantic
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Render Instruction
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result, i) => (
              <tr key={i}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {result.field}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {result.dataType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${result.bestMatch?.semantic === 'email' ? 'bg-blue-100 text-blue-800' : ''}
                    ${result.bestMatch?.semantic === 'currency' ? 'bg-green-100 text-green-800' : ''}
                    ${result.bestMatch?.semantic === 'premium' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${result.bestMatch?.semantic === 'cancellation' ? 'bg-red-100 text-red-800' : ''}
                    ${result.bestMatch?.semantic === 'temporal' ? 'bg-purple-100 text-purple-800' : ''}
                    ${result.bestMatch?.semantic === 'danger' ? 'bg-red-100 text-red-800' : ''}
                    ${result.bestMatch?.semantic === 'url' ? 'bg-indigo-100 text-indigo-800' : ''}
                    ${result.bestMatch?.semantic === 'percentage' ? 'bg-teal-100 text-teal-800' : ''}
                    ${!result.bestMatch ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {result.bestMatch?.semantic || 'unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="font-mono">
                    {result.bestMatch ? `${result.bestMatch.confidence}%` : '—'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <code className="text-xs bg-gray-50 px-2 py-1 rounded">
                    {result.renderInstruction.component}
                    {result.renderInstruction.variant && `:${result.renderInstruction.variant}`}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <ol className="space-y-2 text-sm">
            <li className="flex">
              <span className="font-bold mr-2">1.</span>
              <span>Analyzes field names for semantic patterns</span>
            </li>
            <li className="flex">
              <span className="font-bold mr-2">2.</span>
              <span>Checks data types for additional context</span>
            </li>
            <li className="flex">
              <span className="font-bold mr-2">3.</span>
              <span>Assigns confidence scores to matches</span>
            </li>
            <li className="flex">
              <span className="font-bold mr-2">4.</span>
              <span>Returns render instructions for UI</span>
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Why This Matters</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex">
              <span className="mr-2">✅</span>
              <span>No more manual component mapping</span>
            </li>
            <li className="flex">
              <span className="mr-2">✅</span>
              <span>Consistent UI across your app</span>
            </li>
            <li className="flex">
              <span className="mr-2">✅</span>
              <span>Works with any database schema</span>
            </li>
            <li className="flex">
              <span className="mr-2">✅</span>
              <span>Zero dependencies, pure functions</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🏆 Built with Claude Code</h3>
        <p className="text-sm text-gray-700">
          This project was built in collaboration with Claude Code, shipping 2 npm packages
          in one session. AI pair programming at its finest!
        </p>
      </div>
    </main>
  )
}