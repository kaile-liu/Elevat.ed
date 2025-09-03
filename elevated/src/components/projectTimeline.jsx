import React from "react";

const ProjectTimeline = ({ projectDates }) => {
  // Deconstruct dates
  const {
    training_start_date,
    training_end_date,
    project_start_date,
    project_end_date,
    mid_term_presentation_start_date,
    mid_term_presentation_end_date,
  } = projectDates;

  // Convert date strings to Date objects
  const trainingStart = new Date(training_start_date);
  const trainingEnd = new Date(training_end_date);
  const projectStart = new Date(project_start_date);
  const projectEnd = new Date(project_end_date);
  const midTermStart = new Date(mid_term_presentation_start_date);
  const midTermEnd = new Date(mid_term_presentation_end_date);
  const today = new Date();

  // Position for today's vertical line
  const todayOffset = Math.max(
    0,
    Math.min(
      100,
      ((today - trainingStart) / (projectEnd - trainingStart)) * 100
    )
  );

  // Total duration in days
  const totalDays = Math.ceil(
    (projectEnd - trainingStart) / (1000 * 60 * 60 * 24)
  );

  // Utility to get % position for Gantt bars
  const calcPosition = (start, end) => {
    const startOffset = Math.ceil(
      (start - trainingStart) / (1000 * 60 * 60 * 24)
    );
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  const calcOffset = (dateString, startDate, endDate) => {
    const date = new Date(dateString);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const totalDuration = end - start; // total ms
    const offset = date - start;       // ms from start to this event

    // Clamp between 0–100%
    return Math.max(0, Math.min(100, (offset / totalDuration) * 100));
    };


  const formatDate = (dateString) => {
    const date = new Date(dateString); // works for "YYYY-MM-DD" strings
    const options = { month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
    };

  return (
    <div className="w-3xl">
        {/* today */}
        <div className="w-full h-8 relative">
            <div
            className="absolute top-2 text-sm font-normal !text-green-full"
            style={{ left: `${todayOffset-2}%` }}
            >
                Today
            </div>
        </div>

        <div className="w-full relative p-0 border-2 border-green-med-dark/25 overflow-hidden">
            {/* Vertical Today Line */}
            <div
            className="absolute top-0 bottom-0 w-1 border-l-2 border-green-med z-10 rounded-full"
            style={{ left: `${todayOffset}%` }}
            >
            </div>
            {/* darken right */}
            <div
            className="absolute top-0 bottom-0 bg-white/40 z-10"
            style={calcPosition(today, projectEnd)}
            >
            </div>

        <div className="relative w-full h-40">

            {/* Training Bar */}
            <div
            className="absolute top-4 p-2 bg-green-full flex items-center justify-center"
            style={calcPosition(trainingStart, trainingEnd)}
            title="Training"
            >
                <div className="absolute left-0 top-full h-9999 w-1 border-dotted divide-dotted border-l-2 border-green-med-dark z-10 rounded-full"></div>
            <span className="text-white font-semibold text-xs">Training</span>
            </div>

            {/* Project Bar */}
            <div
            className="absolute top-14 p-2 bg-blue-full flex items-center justify-center"
            style={calcPosition(projectStart, projectEnd)}
            title="Project"
            >
            <div className="absolute left-0 top-full h-9999 w-1 border-dotted divide-dotted border-l-2 border-green-med-dark z-10 rounded-full"></div>
            <span className="text-white font-semibold text-xs">Project</span>
            </div>

            {/* Mid-term Presentation */}
            <div
            className="absolute top-24 p-2 bg-green-med  flex items-center justify-center"
            style={calcPosition(midTermStart, midTermEnd)}
            title="Mid-term Presentation"
            >
                <div className="absolute left-0 top-full h-9999 w-1 border-dotted divide-dotted border-l-2 border-green-med-dark z-10 rounded-full"></div>
            <span className="text-white font-semibold text-xs">Mid-term</span>
            </div>

            {/* Final Events (last week) */}
            <div
            className="absolute top-24 p-2 bg-blue-med  flex items-center justify-center"
            style={calcPosition(
                new Date(projectEnd.getTime() - 7 * 24 * 60 * 60 * 1000),
                projectEnd
            )}
            title="Final Week Events"
            >
                <div className="absolute left-0 top-full h-9999 w-1 border-dotted divide-dotted border-l-2 border-green-med-dark z-10 rounded-full"></div>
            <span className="text-white font-semibold text-xs">
                Final Week
            </span>
            </div>
        </div>

        {/* Dates */}
        {/* <div className="flex justify-between text-xs text-gray-600 mt-4">
            <span>{trainingStart.toLocaleDateString("en-GB")}</span>
            <span>{projectEnd.toLocaleDateString("en-GB")}</span>
        </div> */}
        </div>

        {/* dates */}
        <div className="w-full h-8 relative">
            <div
            className="absolute top-2 text-sm font-normal !text-green-dark/90"
            style={{ left: `${calcOffset(trainingStart, trainingStart, projectEnd) - 2}%` }}
            >
                {formatDate(trainingStart)}
            </div>

            <div
            className="absolute top-2 text-sm font-normal !text-green-dark/90"
            style={{ left: `${calcOffset(projectStart, trainingStart, projectEnd) - 2}%` }}
            >
                {formatDate(projectStart)}
            </div>

            <div
            className="absolute top-2 text-sm font-normal !text-green-dark/90"
            style={{ left: `${calcOffset(midTermStart, trainingStart, projectEnd) - 2}%` }}
            >
                {formatDate(midTermStart)}
            </div>

            <div
            className="absolute top-2 text-sm font-normal !text-green-dark/90"
            style={{ left: `${calcOffset(new Date(projectEnd.getTime() - 7 * 24 * 60 * 60 * 1000), trainingStart, projectEnd) - 2}%` }}
            >
                {formatDate(new Date(projectEnd.getTime() - 7 * 24 * 60 * 60 * 1000))}
            </div>
        </div>
    </ div>
  );
};

export default ProjectTimeline;
