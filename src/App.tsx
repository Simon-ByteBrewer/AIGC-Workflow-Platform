import React from 'react';
import { Header } from './components/Header';
import { ParameterInput } from './components/ParameterInput';
import { MaterialUpload } from './components/MaterialUpload';
import { MaterialLibrary } from './components/MaterialLibrary';
import { GenerationControl } from './components/GenerationControl';
import { TaskStatusDisplay } from './components/TaskStatusDisplay';
import { HistoryList } from './components/HistoryList';

function App() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <ParameterInput />
            <MaterialUpload />
            <MaterialLibrary />
            <GenerationControl />
          </div>
          
          {/* Right Column: Status & History */}
          <div className="lg:col-span-5 flex flex-col">
            <TaskStatusDisplay />
            <HistoryList />
          </div>
          
        </div>
      </main>
    </div>
  );
}

export default App;
