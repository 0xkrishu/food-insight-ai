'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Webcam from 'react-webcam';

interface AnalysisResult {
  foodName: string;
  calories: number;
  nutrition: {
    carbs: number;
    protein: number;
    fat: number;
  };
  healthiness: 'good' | 'okay' | 'bad';
  suggestions: string[];
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setAnalysisResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    setShowCamera(true);
  };

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setSelectedImage(imageSrc);
        setAnalysisResult(null);
        setError(null);
        setShowCamera(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze image');
        } else {
          throw new Error('Failed to analyze image');
        }
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-4 sm:p-8">
      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Know Your Food 🍽️
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Upload or capture food to get nutrition insights with AI
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-8 transform transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={triggerFileInput}
              className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Upload Image
            </button>
            <button
              onClick={handleCapture}
              className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Capture with Camera
            </button>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg animate-shake">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {selectedImage && (
            <div className="mb-8 animate-fade-in">
              <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-md bg-gray-100">
                <Image
                  src={selectedImage}
                  alt="Selected food"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`mt-4 w-full sm:w-auto px-8 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mx-auto shadow-sm hover:shadow-md ${
                  isAnalyzing ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Analyze Food
                  </>
                )}
              </button>
            </div>
          )}

          {analysisResult && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl animate-fade-in">
              <div className="space-y-6">
                {/* Food Name Section */}
                <div className="flex items-center gap-3">
                  <div className="bg-pink-50 p-2 rounded-xl transform transition-all duration-300 hover:scale-110">
                    <span className="text-2xl">🍕</span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{analysisResult.foodName}</h2>
                    <p className="text-sm text-gray-500">Identified Food Item</p>
                  </div>
                </div>

                {/* Calories Section */}
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 p-2 rounded-xl transform transition-all duration-300 hover:scale-110">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{analysisResult.calories}</h3>
                    <p className="text-sm text-gray-500">Estimated Calories</p>
                  </div>
                </div>

                {/* Nutrition Section */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🍽️</span>
                    <h3 className="text-lg font-semibold text-gray-800">Nutrition Facts</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                      <p className="text-sm text-gray-500 mb-1">Carbs</p>
                      <p className="text-xl font-bold text-blue-600">{analysisResult.nutrition.carbs}g</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                      <p className="text-sm text-gray-500 mb-1">Protein</p>
                      <p className="text-xl font-bold text-green-600">{analysisResult.nutrition.protein}g</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                      <p className="text-sm text-gray-500 mb-1">Fat</p>
                      <p className="text-xl font-bold text-yellow-600">{analysisResult.nutrition.fat}g</p>
                    </div>
                  </div>
                </div>

                {/* Healthiness Section */}
                <div className="flex items-center gap-3">
                  <div className="bg-purple-50 p-2 rounded-xl transform transition-all duration-300 hover:scale-110">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Health Rating</h3>
                    <p className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium transform transition-all duration-300 hover:scale-105 ${
                      analysisResult.healthiness === 'good'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : analysisResult.healthiness === 'okay'
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {analysisResult.healthiness.charAt(0).toUpperCase() + analysisResult.healthiness.slice(1)}
                    </p>
                  </div>
                </div>

                {/* Health Tips Section */}
                {analysisResult.suggestions && Array.isArray(analysisResult.suggestions) && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">💡</span>
                      <h3 className="text-lg font-semibold text-gray-800">Health Tips</h3>
                    </div>
                    <ul className="space-y-2">
                      {analysisResult.suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 bg-white p-3 rounded-lg shadow-sm transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                        >
                          <span className="text-green-500 mt-1">•</span>
                          <p className="text-gray-600">{suggestion}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(!analysisResult.suggestions || analysisResult.suggestions.length === 0) && (
                   <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-600 italic">
                     No health suggestions available for this item.
                   </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-4 max-w-2xl w-full transform transition-all duration-300 animate-scale-in">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-900">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: "environment",
                  width: { ideal: 1920 },
                  height: { ideal: 1080 }
                }}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              <button
                onClick={() => setShowCamera(false)}
                className="px-6 h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={captureImage}
                className="px-6 h-12 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
