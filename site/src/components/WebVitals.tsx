'use client';

import posthog from 'posthog-js';
import { useReportWebVitals } from 'next/web-vitals';

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0];

const reportWebVitals: ReportWebVitalsCallback = (metric) => {
  posthog.capture('web_vital_reported', {
    metric_id: metric.id,
    metric_name: metric.name,
    metric_value: metric.value,
    metric_delta: metric.delta,
    metric_rating: metric.rating,
    navigation_type: metric.navigationType,
    pathname: window.location.pathname,
  });
};

export default function WebVitals() {
  useReportWebVitals(reportWebVitals);
  return null;
}
