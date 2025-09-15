// frontend/src/pages/AI/AIAssistantPage.tsx
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { aiService } from "../../services/api";
import {
  CpuChipIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  SparklesIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"recommendations" | "syllabus">(
    "recommendations"
  );
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [syllabus, setSyllabus] = useState<any>(null);

  // Recommendation form state
  const [interests, setInterests] = useState<string>("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [preferredAreas, setPreferredAreas] = useState<string>("");

  // Syllabus form state
  const [topic, setTopic] = useState("");
  const [credits, setCredits] = useState(3);
  const [level, setLevel] = useState("undergraduate");
  const [duration, setDuration] = useState("16 weeks");

  const handleGetRecommendations = async () => {
    if (!interests.trim()) {
      toast.error("Please enter your interests");
      return;
    }

    try {
      setLoading(true);
      const response = await aiService.recommend({
        interests: interests
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        academicLevel,
        preferredAreas: preferredAreas
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      });

      setRecommendations(response.data);
      toast.success("Recommendations generated successfully!");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to get recommendations";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSyllabus = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a course topic");
      return;
    }

    try {
      setLoading(true);
      const response = await aiService.generateSyllabus({
        topic,
        credits,
        level,
        duration,
      });

      setSyllabus(response.data);
      toast.success("Syllabus generated successfully!");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to generate syllabus";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CpuChipIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
        </div>
        <p className="text-sm text-gray-600">
          Get personalized course recommendations and generate comprehensive
          syllabi using AI.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "recommendations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <AcademicCapIcon className="h-5 w-5 inline mr-2" />
            Course Recommendations
          </button>
          {user?.role !== "student" && (
            <button
              onClick={() => setActiveTab("syllabus")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "syllabus"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Syllabus Generator
            </button>
          )}
        </nav>
      </div>

      {/* Course Recommendations Tab */}
      {activeTab === "recommendations" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Get Personalized Recommendations
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Interests *
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., computer science, artificial intelligence, web development"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple interests with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Level
                </label>
                <select
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select level</option>
                  <option value="freshman">Freshman</option>
                  <option value="sophomore">Sophomore</option>
                  <option value="junior">Junior</option>
                  <option value="senior">Senior</option>
                  <option value="graduate">Graduate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Study Areas
                </label>
                <input
                  type="text"
                  value={preferredAreas}
                  onChange={(e) => setPreferredAreas(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., mathematics, programming, data analysis"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Separate with commas
                </p>
              </div>

              <button
                onClick={handleGetRecommendations}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 inline mr-2" />
                    Get Recommendations
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recommendations
            </h2>

            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {rec.course.title}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {rec.score}% match
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {rec.course.description}
                    </p>
                    <p className="text-sm text-green-600">{rec.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Enter your interests to get personalized course
                  recommendations
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Syllabus Generator Tab */}
      {activeTab === "syllabus" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Generate Course Syllabus
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Introduction to Machine Learning"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits
                  </label>
                  <select
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Credits
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="undergraduate">Undergraduate</option>
                    <option value="graduate">Graduate</option>
                    <option value="doctoral">Doctoral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="8 weeks">8 weeks</option>
                  <option value="12 weeks">12 weeks</option>
                  <option value="16 weeks">16 weeks</option>
                  <option value="18 weeks">18 weeks</option>
                </select>
              </div>

              <button
                onClick={handleGenerateSyllabus}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  <>
                    <DocumentTextIcon className="h-4 w-4 inline mr-2" />
                    Generate Syllabus
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Generated Syllabus
            </h2>

            {syllabus ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg">{syllabus.title}</h3>
                  <p className="text-gray-700 mt-2">{syllabus.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Learning Objectives</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {syllabus.objectives.map((obj: string, index: number) => (
                      <li key={index}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Assessment Structure</h4>
                  <div className="space-y-2">
                    {syllabus.assessments.map(
                      (assessment: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm"
                        >
                          <span>{assessment.type}</span>
                          <span className="font-medium">
                            {assessment.weight}%
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Weekly Schedule</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {syllabus.weeklySchedule
                      .slice(0, 8)
                      .map((week: any, index: number) => (
                        <div
                          key={index}
                          className="text-sm border-l-2 border-blue-200 pl-3"
                        >
                          <span className="font-medium">Week {week.week}:</span>{" "}
                          {week.topic}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Enter course details to generate a comprehensive syllabus
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
