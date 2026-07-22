/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WeeklyGameAnalysisPage } from '../pages/WeeklyGameAnalysis';

interface WeeklyGameAnalysisProps {
  season: number;
  week: number;
}

export const WeeklyGameAnalysis: React.FC<WeeklyGameAnalysisProps> = ({ season, week }) => {
  return <WeeklyGameAnalysisPage season={season} week={week} />;
};
