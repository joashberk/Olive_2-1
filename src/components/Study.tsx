function Study() {
  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
        <h2 className="text-2xl font-bold mb-4 text-dark-100">Scripture</h2>
        {/* Bible text component here */}
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
        <h2 className="text-2xl font-bold mb-4 text-dark-100">Notes & Insights</h2>
        <div className="space-y-4">
          <p className="text-dark-200">Note-taking functionality coming soon!</p>
        </div>
      </div>
    </div>
  );
}

export default Study;