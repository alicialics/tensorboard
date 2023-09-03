/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {createFeatureSelector, createSelector} from '@ngrx/store';
import {
  DiscreteFilter,
  HparamAndMetricSpec,
  HparamValue,
  IntervalFilter,
  RunToHparamsAndMetrics,
} from '../types';
import {combineHparamAndMetricSpecs} from './hparams_selectors_utils';
import {HparamsState, HPARAMS_FEATURE_KEY, HparamFilter} from './types';
import {
  combineDefaultHparamFilters,
  combineDefaultMetricFilters,
  getIdFromExperimentIds,
  hparamSpecToDefaultFilter,
} from './utils';

const getHparamsState =
  createFeatureSelector<HparamsState>(HPARAMS_FEATURE_KEY);

function getHparamsDefaultFiltersForExperimentsResultFunction(
  state: HparamsState,
  experimentIds: string[]
): Map<string, DiscreteFilter | IntervalFilter> {
  const defaultFilterMaps: Array<Map<string, DiscreteFilter | IntervalFilter>> =
    [];

  for (const experimentId of experimentIds) {
    if (!state.specs[experimentId]) {
      continue;
    }

    defaultFilterMaps.push(state.specs[experimentId].hparam.defaultFilters);
  }

  return combineDefaultHparamFilters(defaultFilterMaps);
}

const getHparamsDefaultFiltersForExperiments = createSelector(
  getHparamsState,
  getHparamsDefaultFiltersForExperimentsResultFunction
);

function getHparamsDefaultFiltersForExperimentsFromExperimentIds(
  experimentIds: string[]
) {
  return createSelector(getHparamsState, (state) =>
    getHparamsDefaultFiltersForExperimentsResultFunction(state, experimentIds)
  );
}

function getHparamFilterMapResultFunction(
  hparamState: HparamsState,
  combinedDefaultfilterMap: Map<string, DiscreteFilter | IntervalFilter>,
  experimentIds: string[]
): Map<string, IntervalFilter | DiscreteFilter> {
  const id = getIdFromExperimentIds(experimentIds);
  const otherFilter = hparamState.filters[id];

  return new Map([
    ...combinedDefaultfilterMap,
    ...(otherFilter?.hparams ?? []),
  ]);
}

export const getHparamFilterMap = createSelector(
  getHparamsState,
  getHparamsDefaultFiltersForExperiments,
  getHparamFilterMapResultFunction
);

export function getHparamFilterMapFromExperimentIds(
  experimentIds: string[],
  includeDefaults?: boolean
) {
  return createSelector(
    getHparamsState,
    getHparamsDefaultFiltersForExperimentsFromExperimentIds(experimentIds),
    (hparamState, defaultFilterMap) =>
      getHparamFilterMapResultFunction(
        hparamState,
        includeDefaults ? defaultFilterMap : new Map(),
        experimentIds
      )
  );
}

function getMetricsDefaultFiltersForExperimentsResultFunction(
  state: HparamsState,
  experimentIds: string[]
): Map<string, IntervalFilter> {
  const defaultFilterMaps: Array<Map<string, IntervalFilter>> = [];

  for (const experimentId of experimentIds) {
    if (!state.specs[experimentId]) {
      continue;
    }

    defaultFilterMaps.push(state.specs[experimentId].metric.defaultFilters);
  }

  return combineDefaultMetricFilters(defaultFilterMaps);
}

const getMetricsDefaultFiltersForExperiments = createSelector(
  getHparamsState,
  getMetricsDefaultFiltersForExperimentsResultFunction
);

function getMetricsDefaultFiltersForExperimentsFromExperimentIds(
  experimentIds: string[]
) {
  return createSelector(getHparamsState, (state) =>
    getMetricsDefaultFiltersForExperimentsResultFunction(state, experimentIds)
  );
}

function getMetricFilterMapResultFunction(
  hparamState: HparamsState,
  defaultFilterMap: Map<string, IntervalFilter>,
  experimentIds: string[]
): Map<string, IntervalFilter> {
  const id = getIdFromExperimentIds(experimentIds);
  const otherFilter = hparamState.filters[id];

  return new Map([...defaultFilterMap, ...(otherFilter?.metrics ?? [])]);
}

export const getMetricFilterMap = createSelector(
  getHparamsState,
  getMetricsDefaultFiltersForExperiments,
  getMetricFilterMapResultFunction
);

export function getMetricFilterMapFromExperimentIds(
  experimentIds: string[],
  includeDefaults?: boolean
) {
  return createSelector(
    getHparamsState,
    getMetricsDefaultFiltersForExperimentsFromExperimentIds(experimentIds),
    (state, defaultFilterMap) =>
      getMetricFilterMapResultFunction(
        state,
        includeDefaults ? defaultFilterMap : new Map(),
        experimentIds
      )
  );
}

/**
 * Returns Observable that emits hparams and metrics specs of experiments.
 */
export const getExperimentsHparamsAndMetricsSpecs = createSelector(
  getHparamsState,
  (
    state: HparamsState,
    props: {experimentIds: string[]}
  ): HparamAndMetricSpec => {
    return combineHparamAndMetricSpecs(
      ...(props.experimentIds
        .map((eid) => {
          const data = state.specs[eid];
          if (!data) return null;
          return {
            hparams: data.hparam.specs,
            metrics: data.metric.specs,
          };
        })
        .filter(Boolean) as HparamAndMetricSpec[])
    );
  }
);

export const getDashboardHparamsAndMetricsSpecs = createSelector(
  getHparamsState,
  (state: HparamsState) => {
    return state.dashboardSpecs;
  }
);

export const getDashboardRunsToHparamsAndMetrics = createSelector(
  getHparamsState,
  (state): RunToHparamsAndMetrics => {
    const runToHparamsAndMetrics: RunToHparamsAndMetrics = {};

    for (const sessionGroup of state.dashboardSessionGroups) {
      const hparams: HparamValue[] = Object.entries(sessionGroup.hparams).map(
        (keyValue) => {
          const [hparam, value] = keyValue;
          return {name: hparam, value};
        }
      );

      for (const session of sessionGroup.sessions) {
        runToHparamsAndMetrics[session.name] = {
          metrics: [],
          hparams,
        };

        for (const metricValue of session.metricValues) {
          const runId = metricValue.name.group
            ? `${session.name}/${metricValue.name.group}`
            : session.name;

          const hparamsAndMetrics = runToHparamsAndMetrics[runId] || {
            metrics: [],
            hparams,
          };
          hparamsAndMetrics.metrics.push({
            tag: metricValue.name.tag,
            trainingStep: metricValue.trainingStep,
            value: metricValue.value,
          });
          runToHparamsAndMetrics[runId] = hparamsAndMetrics;
        }
      }
    }
    return runToHparamsAndMetrics;
  }
);

export const getDashboardDefaultHparamFilters = createSelector(
  getDashboardHparamsAndMetricsSpecs,
  (specs): Map<string, HparamFilter> => {
    const hparams = new Map(
      specs.hparams.map((hparamSpec) => {
        return [hparamSpec.name, hparamSpecToDefaultFilter(hparamSpec)];
      })
    );

    return hparams;
  }
);

export const getDashboardHparamFilterMap = createSelector(
  getHparamsState,
  (state) => {
    return state.dashboardFilters.hparams;
  }
);

export const getDashboardMetricsFilterMap = createSelector(
  getHparamsState,
  (state) => {
    return state.dashboardFilters.metrics;
  }
);
