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
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <main className="container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Header Section */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Know Your Food 🍽️
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 font-medium">
              Upload or capture food to get nutrition insights with AI
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 sm:p-10 border border-white/20">
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={triggerFileInput}
                className="group relative h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  📁 Upload Image
                </span>
              </button>
              
              <button
                onClick={handleCapture}
                className="group relative h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  📷 Capture with Camera
                </span>
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {selectedImage && (
              <div className="mt-8 space-y-6">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg bg-gray-100">
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
                  className={`w-full h-14 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0 ${
                    isAnalyzing ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze Food'
                  )}
                </button>
              </div>
            )}

            {analysisResult && (
              <div className="mt-8 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-pink-50 p-3 rounded-xl">
                      <span className="text-2xl">🍕</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{analysisResult.foodName}</h2>
                      <p className="text-sm text-gray-500">Identified Food Item</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Carbs</p>
                      <p className="text-xl font-bold text-blue-600">{analysisResult.nutrition.carbs}g</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Protein</p>
                      <p className="text-xl font-bold text-green-600">{analysisResult.nutrition.protein}g</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Fat</p>
                      <p className="text-xl font-bold text-yellow-600">{analysisResult.nutrition.fat}g</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="bg-purple-50 p-3 rounded-xl">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Health Rating</h3>
                      <p className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
                        analysisResult.healthiness === 'good'
                          ? 'bg-green-100 text-green-700'
                          : analysisResult.healthiness === 'okay'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {analysisResult.healthiness.charAt(0).toUpperCase() + analysisResult.healthiness.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}




