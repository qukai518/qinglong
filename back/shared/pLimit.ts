import pLimit from "p-limit";
import os from 'os';
import { AuthDataType, AuthModel } from "../data/auth";

class TaskLimit {
  private customLimit: number = 0;
  private oneLimit = pLimit(1);
  private get cpuLimit() {
    return pLimit(this.customLimit || Math.max(os.cpus().length, 4))
  }

  constructor() {
    this.setCustomLimit();
  }

  public async setCustomLimit(limit?: number) {
    if (limit) {
      this.customLimit = limit;
      return;
    }
    const doc = await AuthModel.findOne({ where: { type: AuthDataType.systemConfig } });
    if (doc?.info?.cronConcurrency) {
      this.customLimit = doc?.info?.cronConcurrency;
    }
  }

  public runWithCpuLimit<T>(fn: () => Promise<T>): Promise<T> {
    return this.cpuLimit(() => {
      return fn();
    });
  }

  public runOneByOne<T>(fn: () => Promise<T>): Promise<T> {
    return this.oneLimit(() => {
      return fn();
    });
  }
}

export default new TaskLimit();
