import React, { useState, useMemo } from 'react';
import { Lock, Clock, BookOpen } from 'lucide-react';
import { Course, SiteSettings } from '../types';

interface CourseGalleryProps {
  courses: Course[];
  settings?: SiteSettings;
  onSelectCourse: (course: Course) => void;
  onQuickBuy: (course: Course) => void;
}

export const CourseGallery: React.FC<CourseGalleryProps> = ({
  courses,
  settings,
  onSelectCourse,
  onQuickBuy,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ['all', ...Array.from(set)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (selectedCategory === 'all') return courses;
    return courses.filter((c) => c.category === selectedCategory);
  }, [courses, selectedCategory]);

  return (
    <section id="courses" className="py-12 sm:py-16 lg:py-20 border-b border-slate-800/80 bg-slate-950 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>ভিডিও কোর্স গ্যালারি</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {settings?.galleryHeading || 'প্রিমিয়াম ভিডিও কোর্সসমূহ'}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-2xl">
              {settings?.galleryDescription ||
                'ভিডিও থাম্বনেইলে ক্লিক করে কোর্সের পাঠ্যক্রম এবং পাবলিক প্রিভিউ লেকচার দেখুন।'}
            </p>
          </div>

          {/* Interactive Category Filter Controls (Segmented buttons) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {cat === 'all' ? 'সব কোর্স' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid: EXACTLY 3 COLUMNS ON DESKTOP (lg:grid-cols-3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {filteredCourses.map((course) => {
            const lessonCount = course.lessons?.length || 4;
            const totalHours = Math.round(
              (course.lessons?.reduce((acc, l) => acc + (l.durationMin || 30), 0) || 120) / 60
            );

            return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-900 hover:shadow-xl hover:shadow-cyan-950/20 cursor-pointer"
              >
                {/* 16:9 Video-Cover Locked Gallery Style */}
                <div className="locked-thumbnail-container group-hover:shadow-inner">
                  {/* Blurred locked cover image */}
                  <img
                    src={course.thumbnailUrl || '/src/assets/images/course_web_dev_1792938698048.jpg'}
                    alt={course.title}
                    className="locked-thumbnail-img"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        '/src/assets/images/course_web_dev_1792938698048.jpg';
                    }}
                  />

                  {/* Locked video preview overlay */}
                  <div className="locked-thumbnail-overlay">
                    {/* Centered Prominent Lock Icon in glowing glass circle */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/80 border border-cyan-400/30 text-cyan-300 shadow-xl shadow-cyan-950/60 backdrop-blur-md group-hover:scale-110 group-hover:border-cyan-400/60 transition-all duration-300">
                      <Lock className="h-5 w-5 text-cyan-300" />
                    </div>

                    <span className="mt-2 rounded-full bg-slate-950/70 border border-slate-700/60 px-2.5 py-0.5 text-[10px] font-medium text-slate-300 backdrop-blur-md">
                      লকড প্রিমিয়াম কোর্স
                    </span>
                  </div>

                  {/* Top tags on video cover */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="rounded-md bg-slate-950/80 border border-slate-800 px-2 py-0.5 text-[10px] font-medium text-cyan-400 backdrop-blur-md truncate max-w-[140px]">
                      {course.category}
                    </span>
                    {course.isFeatured && (
                      <span className="rounded-md bg-amber-500/90 text-slate-950 px-2 py-0.5 text-[10px] font-bold shadow-sm">
                        ফিচার্ড
                      </span>
                    )}
                  </div>

                  {/* Bottom duration indicator */}
                  <div className="absolute bottom-2.5 right-2.5 pointer-events-none">
                    <span className="rounded bg-black/80 px-2 py-0.5 text-[10px] font-mono text-slate-200">
                      ~{totalHours} ঘণ্টা
                    </span>
                  </div>
                </div>

                {/* Course Details Body */}
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    {/* Clean unboxed metadata with dot separators */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1.5">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-cyan-400" />
                        <span>{lessonCount}টি লেসন</span>
                      </div>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>ভিডিও ও টেলিগ্রাম</span>
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                      {course.title}
                    </h3>

                    {/* Only render description if provided */}
                    {course.shortDescription && course.shortDescription.trim() ? (
                      <p className="mt-1.5 text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
                        {course.shortDescription}
                      </p>
                    ) : null}

                    {/* Highlights bullet previews */}
                    {course.highlights && course.highlights.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {course.highlights.slice(0, 2).map((hl, i) => (
                          <span
                            key={i}
                            className="text-[10px] text-slate-300 bg-slate-800/80 border border-slate-700/60 rounded px-1.5 py-0.5 truncate max-w-[200px]"
                          >
                            ✓ {hl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clean Premium Card Footer (No green borders, subtle divider, price + বিস্তারিত + এখনই কিনুন) */}
                  {(() => {
                    const basePrice = course.priceBdt || 150;
                    let finalPrice = basePrice;
                    let hasDiscount = false;

                    if (course.discountActive && course.discountValue && course.discountValue > 0) {
                      const now = new Date();
                      let inDate = true;
                      if (course.discountStartDate && now < new Date(course.discountStartDate)) inDate = false;
                      if (course.discountEndDate && now > new Date(course.discountEndDate)) inDate = false;

                      if (inDate) {
                        if (course.discountType === 'percentage') {
                          const pct = Math.min(100, Math.max(0, course.discountValue));
                          finalPrice = Math.max(0, Math.round(basePrice * (1 - pct / 100)));
                          hasDiscount = finalPrice < basePrice;
                        } else {
                          finalPrice = Math.max(0, Math.round(basePrice - course.discountValue));
                          hasDiscount = finalPrice < basePrice;
                        }
                      }
                    }

                    return (
                      <div className="mt-4 pt-3.5 border-t border-slate-800/80 bg-slate-950/40 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-bold text-cyan-400 tabular-nums">
                            ৳{finalPrice}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-slate-500 line-through tabular-nums">
                              ৳{basePrice}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCourse(course);
                            }}
                            className="rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                          >
                            বিস্তারিত
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickBuy(course);
                            }}
                            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
                          >
                            এখনই কিনুন
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
