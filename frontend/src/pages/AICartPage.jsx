import AICartBuilder from "../components/AICartBuilder";

export default function AICartPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <AICartBuilder isOpen={true} onClose={() => {}} />
      </div>
    </div>
  );
}

