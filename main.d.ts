import { SagaMonitor } from "redux-saga";

export type SagaMonitorConfig = {
  level?: "log" | "debug"; // default: 'debug' // logging level
  verbose?: boolean; // default: true; // verbose mode
  color?: string; // default: '#03A9F4';
  rootSagaStart?: boolean; // default: false; // show root saga start effect
  effectTrigger?: boolean; // default: false; // show triggered effects
  effectResolve?: boolean; // default: false; // show resolved effects
  effectReject?: boolean; // default: false; // show rejected effects
  effectCancel?: boolean; // default: false; // show cancelled effects
  actionDispatch?: boolean; // default: false; // show dispatched actions
};

declare function createSagaMonitor(config?: SagaMonitorConfig): SagaMonitor;

export default createSagaMonitor;
