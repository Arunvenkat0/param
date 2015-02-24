/**
 * The OnSession pipeline is called for every new session in site. The pipeline can be used, 
 * e.g. to prepare promotion or pricebooks based on source codes or affiliate information in
 * the initial URL. For performance reasons the pipeline should be kept short.
 */
function Do()
{
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'common/FindDeviceAgent.ds'
    }).execute({
        CurrentRequest: request
    });
    
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	return;
    }
    
    var deviceType = ScriptResult.device;

    CurrentSession.custom.device = deviceType;
}


/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Do = Do;
