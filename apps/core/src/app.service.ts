import { Injectable } from '@nestjs/common';
import { ServerStatusDto } from '@altlab/shared';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getServers(): ServerStatusDto[] {
    return [
      {
        id: 'srv-1',
        name: 'local-node-01',
        ip: '192.168.1.100',
        status: 'online',
        uptimeSeconds: 642300,
        cpuUsagePercent: 14.2,
        memoryUsagePercent: 42.8,
        containersCount: 12,
        virtualMachinesCount: 2,
      },
      {
        id: 'srv-2',
        name: 'storage-nas-02',
        ip: '192.168.1.105',
        status: 'online',
        uptimeSeconds: 1284900,
        cpuUsagePercent: 6.5,
        memoryUsagePercent: 68.1,
        containersCount: 5,
        virtualMachinesCount: 0,
      },
    ];
  }
}
