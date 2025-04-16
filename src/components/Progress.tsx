import { useState } from 'react';

interface Progress {
  chaptersRead: number;
  versesHighlighted: number;
  notesCreated: number;
  studyStreak: number;
}

function Progress() {
  const [progress] = useState<Progress>({
    chaptersRead: 0,
    versesHighlighted: 0,
    notesCreated: 0,
    studyStreak: 0,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center text-dark-100">Your Lamp Oil</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <h3 className="text-xl font-semibold mb-2 text-dark-100">Reading Progress</h3>
          <div className="text-4xl font-bold text-olive-300">
            {progress.chaptersRead}
          </div>
          <div className="text-dark-300">Chapters completed</div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <h3 className="text-xl font-semibold mb-2 text-dark-100">Study Streak</h3>
          <div className="text-4xl font-bold text-olive-300">
            {progress.studyStreak}
          </div>
          <div className="text-dark-300">Days in a row</div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <h3 className="text-xl font-semibold mb-2 text-dark-100">Highlights</h3>
          <div className="text-4xl font-bold text-olive-300">
            {progress.versesHighlighted}
          </div>
          <div className="text-dark-300">Verses highlighted</div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <h3 className="text-xl font-semibold mb-2 text-dark-100">Insights</h3>
          <div className="text-4xl font-bold text-olive-300">
            {progress.notesCreated}
          </div>
          <div className="text-dark-300">Notes created</div>
        </div>
      </div>
    </div>
  );
}

export default Progress;