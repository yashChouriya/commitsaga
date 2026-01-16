"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { repositoriesApi } from "@/lib/repositories";
import type { Export, ExportType } from "@/types";
import { GlassCard, AnimatedSection } from "@/components/ui";
import {
  FileText,
  Download,
  Calendar,
  Clock,
  FileDown,
  Loader2,
  CheckCircle,
  HardDrive,
} from "lucide-react";

export default function ExportPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [exportType, setExportType] = useState<ExportType>("complete");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (repoId) {
      loadExports();
    }
  }, [repoId]);

  const loadExports = async () => {
    try {
      setLoading(true);
      const data = await repositoriesApi.getExports(repoId);
      setExports(data);
    } catch (error) {
      console.error("Failed to load exports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExport = async () => {
    try {
      setCreating(true);
      setSuccessMessage("");

      const data: {
        export_type: ExportType;
        date_range_start?: string;
        date_range_end?: string;
      } = {
        export_type: exportType,
      };

      if (exportType !== "complete" && dateRangeStart && dateRangeEnd) {
        data.date_range_start = dateRangeStart;
        data.date_range_end = dateRangeEnd;
      }

      await repositoriesApi.createExport(repoId, data);
      setSuccessMessage(
        "Export generation started! It will appear below when ready."
      );

      // Poll for new exports
      setTimeout(() => {
        loadExports();
      }, 3000);

      setTimeout(() => {
        loadExports();
      }, 10000);
    } catch (error) {
      console.error("Failed to create export:", error);
    } finally {
      setCreating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = async (exp: Export) => {
    try {
      setDownloading(exp.id);
      // Extract filename from file_path
      const filename = exp.file_path.split("/").pop() || `export-${exp.id}.md`;
      await repositoriesApi.downloadExport(exp.id, filename);
    } catch (error) {
      console.error("Failed to download export:", error);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedSection animation="fade-up" delay={200}>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Export Analysis
              </h2>
              <p className="text-gray-400">
                Generate AI-friendly markdown exports of your repository
                analysis
              </p>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Create Export Form */}
      <AnimatedSection animation="fade-up" delay={300}>
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-6">
            Create New Export
          </h3>

          <div className="space-y-6">
            {/* Export Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Export Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setExportType("complete")}
                  className={`p-4 rounded-xl border transition-all ${
                    exportType === "complete"
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <FileDown
                    className={`w-6 h-6 mb-2 ${
                      exportType === "complete"
                        ? "text-violet-400"
                        : "text-gray-400"
                    }`}
                  />
                  <h4
                    className={`font-medium ${
                      exportType === "complete" ? "text-white" : "text-gray-300"
                    }`}
                  >
                    Complete
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Full repository analysis
                  </p>
                </button>

                <button
                  onClick={() => setExportType("weekly")}
                  className={`p-4 rounded-xl border transition-all ${
                    exportType === "weekly"
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <Calendar
                    className={`w-6 h-6 mb-2 ${
                      exportType === "weekly"
                        ? "text-violet-400"
                        : "text-gray-400"
                    }`}
                  />
                  <h4
                    className={`font-medium ${
                      exportType === "weekly" ? "text-white" : "text-gray-300"
                    }`}
                  >
                    Weekly
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Specific week range
                  </p>
                </button>

                <button
                  onClick={() => setExportType("monthly")}
                  className={`p-4 rounded-xl border transition-all ${
                    exportType === "monthly"
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <Clock
                    className={`w-6 h-6 mb-2 ${
                      exportType === "monthly"
                        ? "text-violet-400"
                        : "text-gray-400"
                    }`}
                  />
                  <h4
                    className={`font-medium ${
                      exportType === "monthly" ? "text-white" : "text-gray-300"
                    }`}
                  >
                    Monthly
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Specific month range
                  </p>
                </button>
              </div>
            </div>

            {/* Date Range (for weekly/monthly) */}
            {exportType !== "complete" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <p className="text-emerald-400">{successMessage}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleCreateExport}
              disabled={
                creating ||
                (exportType !== "complete" &&
                  (!dateRangeStart || !dateRangeEnd))
              }
              className="w-full py-4 bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate Markdown Export
                </>
              )}
            </button>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Export History */}
      <AnimatedSection animation="fade-up" delay={400}>
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-6">
            Export History
          </h3>

          {exports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">
                No exports yet
              </h4>
              <p className="text-gray-400">
                Create your first export using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-linear-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-violet-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">
                          {exp.export_type.charAt(0).toUpperCase() +
                            exp.export_type.slice(1)}{" "}
                          Export
                        </h4>
                        <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">
                          {exp.export_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(exp.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5" />
                          {formatFileSize(exp.file_size)}
                        </span>
                        {exp.date_range_start && exp.date_range_end && (
                          <span>
                            {exp.date_range_start} to {exp.date_range_end}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(exp)}
                    disabled={downloading === exp.id}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {downloading === exp.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {downloading === exp.id ? "Downloading..." : "Download"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </AnimatedSection>

      {/* Info Card */}
      <AnimatedSection animation="fade-up" delay={500}>
        <GlassCard className="bg-linear-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">
                About Markdown Exports
              </h4>
              <p className="text-gray-400 text-sm">
                Exports are generated in Markdown format, optimized for AI
                consumption. They include structured sections for repository
                overview, development timeline, pull requests, issues, and
                contributor information. Perfect for feeding into AI assistants
                or documentation systems.
              </p>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>
    </div>
  );
}
