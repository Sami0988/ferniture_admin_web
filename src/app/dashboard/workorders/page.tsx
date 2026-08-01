'use client';

import { Suspense } from 'react';
import ProjectsContent from './ProjectsContent';
import { SkeletonTable } from '@/components/ui/Skeleton';

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><SkeletonTable rows={8} /></div>}>
      <ProjectsContent />
    </Suspense>
  );
}
