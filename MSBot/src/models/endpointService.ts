import { IEndpointService, ServiceType } from '../schema';
import { ConnectedService } from './connectedService';

export class EndpointService extends ConnectedService implements IEndpointService {
    public readonly type = ServiceType.Endpoint;

    public appId = '';
    public appPassword = '';
    public endpoint = '';

    constructor(source: Partial<IEndpointService>) {
        super(source);
        const { appId = '', appPassword = '', endpoint = '' } = source;
        Object.assign(this, { appId, appPassword, endpoint });
    }

    public toJSON(): Partial<IEndpointService> {
        const { appId = '', id = '', appPassword = '', endpoint = '', name = '' } = this;
        return { appId, id, type: ServiceType.Endpoint, appPassword, endpoint, name };
    }
}
