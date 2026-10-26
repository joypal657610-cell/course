import React, { useState } from 'react';
import { X, Lock, Play, CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Course, Package } from '../types';

interface CourseModalProps {
  course: Course | null;
  packages: Package[];
  onClose: () => void;
  onProceedToCheckout: (course: Course, selectedPackageId: string) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course,
  packages,
  onClose,
  onProceedToCheckout,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || 'pkg_1m');
  const [activePreviewLesson, setActivePreviewLesson] = useState<string | null>(null);

  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-slate-950/70 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Video Preview Banner */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950 border-b border-slate-800">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover filter blur-[2px] brightness-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-950/40 to-transparent flex flex-col justify-end p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold">
                {course.category}
              </span>
              <span className="rounded bg-black/60 text-slate-300 px-2 py-0.5 text-xs font-mono">
                {course.lessons?.length || 4}টি লেসন
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {course.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Course Description (Only rendered if provided) */}
          {(course.fullDescription?.trim() || course.shortDescription?.trim()) ? (
            <div>
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                কোর্স পরিচিতি
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {course.fullDescription || course.shortDescription}
              </p>
            </div>
          ) : null}

          {/* Highlights */}
          {course.highlights && course.highlights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                এই কোর্সে যা যা অন্তর্ভুক্ত
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum & Lessons List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
                কোর্স পাঠ্যক্রম (Curriculum)
              </h3>
              <span className="text-xs text-slate-400">
                পাবলিক প্রিভিউ ব্যতীত সকল পেইড ক্লাস লকড
              </span>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              {course.lessons && course.lessons.length > 0 ? (
                course.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      lesson.isPreview
                        ? 'border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 cursor-pointer'
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-400'
                    }`}
                    onClick={() => {
                      if (lesson.isPreview) {
                        setActivePreviewLesson(activePreviewLesson === lesson.id ? null : lesson.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {lesson.isPreview ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div>
                        <p className={`text-xs sm:text-sm font-medium ${lesson.isPreview ? 'text-cyan-200' : 'text-slate-300'}`}>
                          {lesson.title}
                        </p>
                        {lesson.isPreview && (
                          <p className="text-[11px] text-cyan-400/80">পাবলিক প্রিভিউ ক্লাস (ক্লিক করে দেখুন)</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        {lesson.durationMin} মিনিট
                      </span>
                      {lesson.isPreview ? (
                        <span className="rounded bg-cyan-500/20 text-cyan-300 px-2 py-0.5 text-[10px] font-semibold">
                          ফ্রি প্রিভিউ
                        </span>
                      ) : (
                        <span className="rounded bg-slate-800 text-slate-400 px-2 py-0.5 text-[10px]">
                          লকড
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 p-2">কোনো পাঠ্যক্রম পাওয়া যায়নি।</p>
              )}
            </div>

            {/* Active Preview Lesson Player Simulation */}
            {activePreviewLesson && (
              <div className="mt-4 rounded-xl border border-cyan-500/40 bg-slate-950 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-cyan-400">
                    ফ্রি ট্রায়াল প্রিভিউ প্লেয়ার
                  </span>
                  <button
                    onClick={() => setActivePreviewLesson(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    প্লেয়ার বন্ধ করুন
                  </button>
                </div>
                <div className="relative aspect-video w-full rounded-lg bg-black flex items-center justify-center border border-slate-800">
                  <div className="text-center p-4">
                    <Play className="h-12 w-12 text-cyan-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm font-bold text-white">
                      প্রিভিউ ক্লাস স্ট্রিমিং হচ্ছে
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      বাকি সম্পূর্ণ কোর্স এবং টেলিগ্রাম গ্রুপের জন্য যেকোনো একটি প্যাকেজ বেছে নিন।
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Package Selection & Purchase Strip */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
              প্যাকেজ নির্বাচন করুন
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {packages.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30 shadow-md shadow-cyan-950/40'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{pkg.name}</span>
                      {pkg.badge && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-medium">
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-cyan-400 tabular-nums">
                      ৳{pkg.priceBdt}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {pkg.durationDays ? `${pkg.durationDays} দিন মেয়াদী অ্যাক্সেস` : 'লাইফটাইম আনলিমিটেড'}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Bottom Proceed Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>বিকাশ ও নগদ সেন্ড মানি · কোনো অ্যাকাউন্ট ছাড়া গেস্ট চেকআউট</span>
              </div>

              <button
                type="button"
                onClick={() => onProceedToCheckout(course, selectedPkgId)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
              >
                <span>চেকআউট করুন</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
