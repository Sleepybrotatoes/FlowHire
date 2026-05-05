export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-8">FlowHire ATS</h1>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Applications Pipeline</h2>
        <div className="flex space-x-4">
          <div className="bg-white p-4 rounded shadow w-1/5">
            <h3 className="font-bold mb-2">Applied</h3>
            {/* Applications here */}
          </div>
          <div className="bg-white p-4 rounded shadow w-1/5">
            <h3 className="font-bold mb-2">Screening</h3>
          </div>
          <div className="bg-white p-4 rounded shadow w-1/5">
            <h3 className="font-bold mb-2">Interview</h3>
          </div>
          <div className="bg-white p-4 rounded shadow w-1/5">
            <h3 className="font-bold mb-2">Offer</h3>
          </div>
          <div className="bg-white p-4 rounded shadow w-1/5">
            <h3 className="font-bold mb-2">Rejected</h3>
          </div>
        </div>
      </div>
    </main>
  )
}