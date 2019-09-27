/**
 * Microsoft Bot Token API - V3.1
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: token
 * Contact: botframework@microsoft.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import * as Models from './model';
import { CustomMicrosoftAppCredentials } from '../auth'
import { TokenApiClient } from './tokenApiClient';
import { ApiHelper } from '../apiHelper';


export class BotSignInApi {
    protected _basePath: string;
    protected defaultHeaders = {};
    protected credentials: CustomMicrosoftAppCredentials;
    protected userAgent: string;
    
    constructor(client: TokenApiClient){
        this.credentials = client.credentials;
        this.defaultHeaders = {"content-type": client.requestContentType};
        this.userAgent = client.userAgent;
        this.basePath = client.baseUri;
    }

    set basePath(basePath: string) {
        this._basePath = basePath;
    }

    get basePath() {
        return this._basePath;
    }

    /**
     * 
     * @param state 
     * @param codeChallenge 
     * @param emulatorUrl 
     * @param finalRedirect 
     */
    public async getSignInUrl (state: string, options: Models.BotSignInGetSignInUrlOptionalParams = { }) : Promise<Models.BotSignInGetSignInUrlResponse> {
        const path = this.basePath + '/api/botsignin/GetSignInUrl';
        let queryParameters = {};
        let headerParams = Object.assign({}, this.defaultHeaders);    

        // verify required parameter 'state' is not null or undefined
        if (state === null || state === undefined) {
            throw new Error('Required parameter state was null or undefined when calling getSignInUrl.');
        }

        if (state !== undefined) {
            queryParameters['state'] = ApiHelper.serialize(state, "string");
        }

        if (options.codeChallenge !== undefined) {
            queryParameters['code_challenge'] = ApiHelper.serialize(options.codeChallenge, "string");
        }

        if (options.emulatorUrl !== undefined) {
            queryParameters['emulatorUrl'] = ApiHelper.serialize(options.emulatorUrl, "string");
        }

        if (options.finalRedirect !== undefined) {
            queryParameters['finalRedirect'] = ApiHelper.serialize(options.finalRedirect, "string");
        }

        if (options.channelId !== undefined) {
            queryParameters['channelId'] = ApiHelper.serialize(options.channelId, "string");
        }

        let url = new URL(path)
        Object.keys(queryParameters).forEach(key => url.searchParams.append(key, queryParameters[key]))            
        Object.assign(headerParams, options.headers);

        let requestOptions = {
            method: 'GET',
            uri: path,
            headers: headerParams,            
            json: true,
            proxy: options.proxyOptions,
            userAgent: this.userAgent
        };

        await this.credentials.signRequest(requestOptions); 
              
        return ApiHelper.deserializeResponse<Models.BotSignInGetSignInUrlResponse>(url, requestOptions)
    }
}