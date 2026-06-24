import { useState } from "react";
import { Link } from "react-router-dom";

function GuideMeWizard() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: "room",
      question: "Which room?",
      options: ["Living", "Bedroom", "Kids", "Dining"]
    },
    {
      id: "size",
      question: "Room size?",
      options: ["Small", "Medium", "Large"]
    },
    {
      id: "style",
      question: "Preferred style?",
      options: ["Modern", "Traditional", "Minimal", "Colorful"]
    }
  ];

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
    if (step < questions.length) {
      setStep(step + 1);
    }
  };

  const getRecommendations = () => {
    // Simple logic based on answers
    const room = answers.room?.toLowerCase();
    const size = answers.size?.toLowerCase();
    const style = answers.style?.toLowerCase();

    let category = room;
    if (room === "living") category = "living";
    if (room === "bedroom") category = "bedroom";
    if (room === "kids") category = "kids";
    if (room === "dining") category = "dining";

    return { category, room, size, style };
  };

  if (step <= questions.length) {
    const currentQuestion = questions[step - 1];
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-center mb-6">Guide Me</h2>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
            <div className="space-y-2">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(currentQuestion.id, option)}
                  className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-4 py-2 text-gray-600 disabled:opacity-50"
            >
              Back
            </button>
            <span className="text-sm text-gray-500">{step} of {questions.length}</span>
          </div>
        </div>
      </div>
    );
  }

  const recommendations = getRecommendations();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-6">Handpicked Setup for You</h2>
        <div className="mb-6">
          <p className="text-center text-gray-600 mb-4">
            For your {recommendations.size} {recommendations.room} room with {recommendations.style} style
          </p>
          <p className="text-center text-gray-600">
            Here are {recommendations.size === "small" ? "6" : recommendations.size === "medium" ? "8" : "10"} ideal products
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Link
            to={`/category/${recommendations.category}`}
            className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg text-center hover:bg-amber-700 transition-colors"
          >
            View Recommended Products
          </Link>
          <button
            onClick={() => setStep(1)}
            className="w-full border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}

export default GuideMeWizard;
