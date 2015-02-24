var g = require('./dw/guard');
var f = require('./dw/form');

/**
 * Handles all customer login related storefront processes.
 */

/**
 * This is a central place to login a user from the login form.
 */
function Process()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var loginForm = session.forms.login;


    if (CurrentHttpParameterMap.OAuthProvider.stringValue)
    {
        new dw.system.Pipelet('Script', {
            Transactional: false,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'account/login/oauth/PreInitiateOAuthLogin.ds',
        }).execute();
        

        var InitiateOAuthLoginResult = new dw.system.Pipelet('InitiateOAuthLogin').execute({
            AuthorizationURL: Location,
            OAuthProviderID: CurrentHttpParameterMap.OAuthProvider.stringValue
        });
        if (InitiateOAuthLoginResult.result == PIPELET_ERROR)
        {
        	oAuthFailed();
        	return;
        }
        var Location = InitiateOAuthLoginResult.AuthorizationURL;
        
        
        response.renderTemplate('util/redirect.isml', {
            Location: Location
        });
        return;
    }
    
    
    var GetCustomerResult = new dw.system.Pipelet('GetCustomer').execute({
        Login: loginForm.username.value
    });
    var TempCustomer = GetCustomerResult.Customer;

    if (typeof(TempCustomer) != 'undefined'&& TempCustomer != null && TempCustomer.profile != null && TempCustomer.profile.credentials.locked)
    {
    	return loginFailed();
    }
    
    
    var LoginCustomerResult = new dw.system.Pipelet('LoginCustomer').execute({
        Login: loginForm.username.value,
        Password: loginForm.password.value,
        RememberMe: loginForm.rememberme.value
    });
    if (LoginCustomerResult.result == PIPELET_ERROR)
    {
        if (typeof(TempCustomer) != 'undefined' && TempCustomer != null && TempCustomer.profile != null && TempCustomer.profile.credentials.locked)
        {
            var m = require('./dw/mail');
            m.sendMail({
                MailFrom : dw.system.Site.getCurrent().getCustomPreferenceValue('customerServiceEmail'),
                MailSubject : dw.web.Resource.msg('email.youraccount','email',null),
                MailTemplate : "mail/lockoutemail",
                MailTo : TempCustomer.profile.email
            });
        }
    	
    	return loginFailed();
    }
    
    
    f.clearFormElement(loginForm);

    return {
        login_succeeded: true
    };
}

function loginFailed()
{
    f.invalidateFormElement(session.forms.login.loginsucceeded);
    
    return {
        login_failed: true
    };
}

function oAuthFailed()
{
    f.invalidateFormElement(session.forms.oauthlogin.loginsucceeded);
    
    postFinalizeOAuthLogin();
}

function oAuthSuccess()
{
    f.clearFormElement(session.forms.oauthlogin);
    
    postFinalizeOAuthLogin();
}


function postFinalizeOAuthLogin()
{
    // to continue to the destination (preserved in the session before InitiateOAuthLogin pipelet)
    var Location = session.custom['ContinuationURL']; 

    delete session.custom['ContinuationURL'];

    response.renderTemplate('util/redirect.isml', {
    	Location: Location
    });
}


function OAuthReentryLinkedIn()
{
    var FinalizeOAuthLoginResult = new dw.system.Pipelet('FinalizeOAuthLogin').execute();
    if (FinalizeOAuthLoginResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }
    var ResponseText = FinalizeOAuthLoginResult.ResponseText;
    var AccessToken = FinalizeOAuthLoginResult.AccessToken;
    var RefreshToken = FinalizeOAuthLoginResult.RefreshToken;
    var AccessTokenExpiry = FinalizeOAuthLoginResult.AccessTokenExpiry;
    var OAuthProviderID = FinalizeOAuthLoginResult.OAuthProviderID;
    var ErrorStatus = FinalizeOAuthLoginResult.ErrorStatus;


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'account/login/oauth/ObtainAccountFromLinkedInProviderAndLogin.ds'
    }).execute({
        OAuthProviderId: OAuthProviderID,
        ResponseText: ResponseText
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }

    oAuthSuccess();
}

/**
 * This is the reentry point after an OAuth login, i.e., its URL is passed to the OAuth provider as the redirect URL.
 */
function OAuthReentryGoogle()
{
    var FinalizeOAuthLoginResult = new dw.system.Pipelet('FinalizeOAuthLogin').execute();
    if (FinalizeOAuthLoginResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }
    var ResponseText = FinalizeOAuthLoginResult.ResponseText;
    var AccessToken = FinalizeOAuthLoginResult.AccessToken;
    var RefreshToken = FinalizeOAuthLoginResult.RefreshToken;
    var AccessTokenExpiry = FinalizeOAuthLoginResult.AccessTokenExpiry;
    var OAuthProviderID = FinalizeOAuthLoginResult.OAuthProviderID;
    var ErrorStatus = FinalizeOAuthLoginResult.ErrorStatus;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'account/login/oauth/ObtainAccountFromGoogleProviderAndLogin.ds'
    }).execute({
        ResponseText: ResponseText,
        OAuthProviderID: OAuthProviderID
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }

    oAuthSuccess();
}


function OAuthReentryGooglePlus()
{
    var FinalizeOAuthLoginResult = new dw.system.Pipelet('FinalizeOAuthLogin').execute();
    if (FinalizeOAuthLoginResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }
    var ResponseText = FinalizeOAuthLoginResult.ResponseText;
    var AccessToken = FinalizeOAuthLoginResult.AccessToken;
    var RefreshToken = FinalizeOAuthLoginResult.RefreshToken;
    var AccessTokenExpiry = FinalizeOAuthLoginResult.AccessTokenExpiry;
    var OAuthProviderID = FinalizeOAuthLoginResult.OAuthProviderID;
    var ErrorStatus = FinalizeOAuthLoginResult.ErrorStatus;
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'account/login/oauth/ObtainAccountFromGooglePlusProviderAndLogin.ds'
    }).execute({
        ResponseText: ResponseText,
        OAuthProviderID: OAuthProviderID
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }
    
    oAuthSuccess();
}

function OAuthReentryMicrosoft()
{
    var FinalizeOAuthLoginResult = new dw.system.Pipelet('FinalizeOAuthLogin').execute();
    if (FinalizeOAuthLoginResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }
    var ResponseText = FinalizeOAuthLoginResult.ResponseText;
    var AccessToken = FinalizeOAuthLoginResult.AccessToken;
    var RefreshToken = FinalizeOAuthLoginResult.RefreshToken;
    var AccessTokenExpiry = FinalizeOAuthLoginResult.AccessTokenExpiry;
    var OAuthProviderID = FinalizeOAuthLoginResult.OAuthProviderID;
    var ErrorStatus = FinalizeOAuthLoginResult.ErrorStatus;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'account/login/oauth/ObtainAccountFromMicrosoftProviderAndLogin.ds'
    }).execute({
        ResponseText: ResponseText,
        OAuthProviderID: OAuthProviderID
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }

    oAuthSuccess();
}

function OAuthReentryFacebook()
{
    var FinalizeOAuthLoginResult = new dw.system.Pipelet('FinalizeOAuthLogin').execute();
    if (FinalizeOAuthLoginResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }
    var ResponseText = FinalizeOAuthLoginResult.ResponseText;
    var AccessToken = FinalizeOAuthLoginResult.AccessToken;
    var RefreshToken = FinalizeOAuthLoginResult.RefreshToken;
    var OAuthProviderID = FinalizeOAuthLoginResult.OAuthProviderID;
    var AccessTokenExpiry = FinalizeOAuthLoginResult.AccessTokenExpiry;
    var ErrorStatus = FinalizeOAuthLoginResult.ErrorStatus;
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'account/login/oauth/ObtainAccountFromFacebookProviderAndLogin.ds'
    }).execute({
        ResponseText: ResponseText,
        OAuthProviderID: OAuthProviderID
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }

    oAuthSuccess();
}

function OAuthReentryGitHub()
{
    var FinalizeOAuthLoginResult = new dw.system.Pipelet('FinalizeOAuthLogin').execute();
    if (FinalizeOAuthLoginResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }
    var ResponseText = FinalizeOAuthLoginResult.ResponseText;
    var AccessToken = FinalizeOAuthLoginResult.AccessToken;
    var RefreshToken = FinalizeOAuthLoginResult.RefreshToken;
    var AccessTokenExpiry = FinalizeOAuthLoginResult.AccessTokenExpiry;
    var OAuthProviderID = FinalizeOAuthLoginResult.OAuthProviderID;
    var ErrorStatus = FinalizeOAuthLoginResult.ErrorStatus;
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'account/login/oauth/ObtainAccountFromGitHubProviderAndLogin.ds'
    }).execute({
        ResponseText: ResponseText,
        OAuthProviderID: OAuthProviderID
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }

    oAuthSuccess();
}

function OAuthReentrySinaWeibo()
{
    var FinalizeOAuthLoginResult = new dw.system.Pipelet('FinalizeOAuthLogin').execute();
    if (FinalizeOAuthLoginResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }
    var ResponseText = FinalizeOAuthLoginResult.ResponseText;
    var AccessToken = FinalizeOAuthLoginResult.AccessToken;
    var RefreshToken = FinalizeOAuthLoginResult.RefreshToken;
    var AccessTokenExpiry = FinalizeOAuthLoginResult.AccessTokenExpiry;
    var OAuthProviderID = FinalizeOAuthLoginResult.OAuthProviderID;
    var ErrorStatus = FinalizeOAuthLoginResult.ErrorStatus;
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'account/login/oauth/ObtainAccountFromSinaWeiboProviderAndLogin.ds'
    }).execute({
        ResponseText: ResponseText,
        OAuthProviderID: OAuthProviderID
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }

    oAuthSuccess();
}

/**
 * Logs out the authenticated customer
 */
function OAuthReentryVKontakte()
{
    var FinalizeOAuthLoginResult = new dw.system.Pipelet('FinalizeOAuthLogin').execute();
    if (FinalizeOAuthLoginResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }
    var ResponseText = FinalizeOAuthLoginResult.ResponseText;
    var AccessToken = FinalizeOAuthLoginResult.AccessToken;
    var RefreshToken = FinalizeOAuthLoginResult.RefreshToken;
    var AccessTokenExpiry = FinalizeOAuthLoginResult.AccessTokenExpiry;
    var OAuthProviderID = FinalizeOAuthLoginResult.OAuthProviderID;
    var ErrorStatus = FinalizeOAuthLoginResult.ErrorStatus;
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'account/login/oauth/ObtainAccountFromVKontakteProviderAndLogin.ds'
    }).execute({
        ResponseText: ResponseText,
        OAuthProviderID: OAuthProviderID,
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	oAuthFailed();
    	return;
    }

    oAuthSuccess();
}

function Logout()
{
    var forms = session.forms;
    
    new dw.system.Pipelet('LogoutCustomer').execute();
    
    f.clearFormElement(forms.login);
    f.clearFormElement(forms.profile);
    

    // TODO this should be triggered by a hook (afterLogout)
    var CartController = require('./Cart');
    CartController.Calculate();
    
    
    response.redirect(dw.web.URLUtils.https('Account-Show'));
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.OAuthReentryLinkedIn    = g.httpsGet(OAuthReentryLinkedIn);
exports.OAuthReentryGoogle      = g.httpsGet(OAuthReentryGoogle);
exports.OAuthReentryGooglePlus  = g.httpsGet(OAuthReentryGooglePlus);
exports.OAuthReentryMicrosoft   = g.httpsGet(OAuthReentryMicrosoft);
exports.OAuthReentryFacebook    = g.httpsGet(OAuthReentryFacebook);
exports.OAuthReentryGitHub      = g.httpsGet(OAuthReentryGitHub);
exports.OAuthReentrySinaWeibo   = g.httpsGet(OAuthReentrySinaWeibo);
exports.OAuthReentryVKontakte   = g.httpsGet(OAuthReentryVKontakte);
exports.Logout                  = g.all(Logout);

/*
 * Local methods
 */
exports.Process                 = Process;
