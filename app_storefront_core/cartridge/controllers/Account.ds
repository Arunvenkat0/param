var g = require('./dw/guard');
var f = require('./dw/form');
var w = require('./dw/web');

/*
 * Internal helper methods
 */

/**
 * Looks up a customer by its login.
 */
function getCustomerByLogin(login)
{
    var GetCustomerResult = new dw.system.Pipelet('GetCustomer').execute({
        Login : login
    });
    if (GetCustomerResult.result == PIPELET_ERROR)
    {
        return null;
    }

    return GetCustomerResult.Customer;
}

function createCustomer(login, password)
{
    var CreateCustomerResult = new dw.system.Pipelet('CreateCustomer').execute({
        Login : login,
        Password : password
    });
    if (CreateCustomerResult.result == PIPELET_ERROR)
    {
        return null;
    }

    return CreateCustomerResult.Customer;
}

/**
 * Sets the customers login.
 * 
 * @param customer the customer
 * @param login the user name of the customer
 * @param password the password of the current customer
 * @return true, if the login / password was updated
 */
function setLogin(customer, login, password)
{
    if ((customer == null) || (login == null) || (password == null))
    {
        return false;
    }

    return customer.profile.credentials.setLogin(login, password);
}

function loginCustomer(login, password, rememberMe)
{
    var LoginCustomerResult = new dw.system.Pipelet('LoginCustomer').execute({
        Login : login,
        Password : password,
        RememberMe : rememberMe
    });

    return (LoginCustomerResult.result != PIPELET_ERROR);
}

/**
 * Creates a new customer account.
 * 
 * @return true, if the account was created successfully
 */
function createAccount()
{
    var profileForm = session.forms.profile;

    var email = profileForm.customer.email.value;
    var emailConfirmation = profileForm.customer.emailconfirm.value;

    if (email != emailConfirmation)
    {
        profileForm.customer.emailconfirm.invalidateFormElement();
        return false;
    }

    var password = profileForm.login.password.value;
    var passwordConfirmation = profileForm.login.passwordconfirm.value;

    if (password != passwordConfirmation)
    {
        profileForm.login.passwordconfirm.invalidateFormElement();
        return false;
    }

    // check if login is already taken
    var existingCustomer = getCustomerByLogin(email);
    if (existingCustomer != null)
    {
        profileForm.customer.email.invalidateFormElement();
        return false;
    }

    var txn = require('dw/system/Transaction');
    txn.begin();

    // create the new customer
    var newCustomer = createCustomer(email, password);
    if (newCustomer == null)
    {
        txn.rollback();
        profileForm.invalidateFormElement();
        return false;
    }

    if (!f.updateObjectWithForm(newCustomer.profile, profileForm.customer))
    {
        txn.rollback();
        profileForm.invalidateFormElement();
        return false;
    }

    email = profileForm.customer.email.value;
    password = profileForm.login.password.value;

    // set login / password
    if (!setLogin(newCustomer, email, password))
    {
        txn.rollback();
        profileForm.invalidateFormElement();
        return false;
    }

    txn.commit();

    f.updateFormWithObject(session.forms.login, newCustomer.profile.credentials);

    var login = profileForm.customer.email.value;
    password = profileForm.login.password.value;
    var rememberMe = profileForm.login.rememberme.value;

    // login the customer
    return loginCustomer(login, password, rememberMe);
}

/**
 * Checks the given user name on existence and ends on a named end node to
 * communicated the status back.
 */
function checkUserName()
{
    var profileForm = session.forms.profile;

    if (customer.profile.credentials.login == profileForm.customer.email.value)
    {
        return true;
    }

    var GetCustomerResult = new dw.system.Pipelet('GetCustomer').execute({
        Login : profileForm.customer.email.value,
    });
    if (GetCustomerResult.result == PIPELET_ERROR)
    {
        return true;
    }

    return false;
}

function editAccount()
{
    var profileForm = session.forms.profile;

    if (!checkUserName())
    {
        profileForm.customer.email.invalidateFormElement();
        return false;
    }

    if (profileForm.customer.email.value != profileForm.customer.emailconfirm.value)
    {
        profileForm.customer.emailconfirm.invalidateFormElement();
        return false;
    }

    if (profileForm.login.password.value != profileForm.login.passwordconfirm.value)
    {
        profileForm.login.passwordconfirm.invalidateFormElement();
        return false;
    }

    profileForm.login.username.value = profileForm.customer.email.value;

    var txn = require('dw/system/Transaction');
    txn.begin();

    if (!setLogin(customer, profileForm.customer.email.value, profileForm.login.password.value))
    {
        txn.rollback();
        return false;
    }

    var SetCustomerPasswordResult = new dw.system.Pipelet('SetCustomerPassword').execute({
        Password : profileForm.login.password.value,
        Customer : customer
    });
    if (SetCustomerPasswordResult.result == PIPELET_ERROR)
    {
        txn.rollback();
        return false;
    }

    if (!f.updateObjectWithForm(customer.profile, profileForm.customer))
    {
        txn.rollback();
        return false;
    }

    txn.commit();

    profileForm.clearFormElement();

    return true;
}

/**
 * A guard function which ensures that the user is logged in before the action can be executed.
 */
function loggedIn(action)
{
    return function()
    {
        if (!customer.authenticated)
        {
            requireLogin({
                TargetAction : 'Account-Show'
            });
            return;
        }

        action();
    };
}


/*
 * Public controller methods
 */

/**
 * Renders the account overview.
 */
function Show()
{
    w.updatePageMetaDataForContent(dw.content.ContentMgr.getContent('myaccount-home'));

    response.renderTemplate('account/accountoverview');
}

/**
 * Updates the profile of an authenticated customer.
 */
function EditProfile()
{
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;

    var TargetPipeline = 'Account-EditProfile';

    f.clearFormElement(CurrentForms.profile);

    f.updateFormWithObject(CurrentForms.profile.customer, CurrentCustomer.profile);
    f.updateFormWithObject(CurrentForms.profile.login, CurrentCustomer.profile.credentials);
    f.updateFormWithObject(CurrentForms.profile.addressbook.addresses, CurrentCustomer.profile.addressBook.addresses);

    var Status = null;

    w.updatePageMetaDataForContent(dw.content.ContentMgr.getContent('myaccount-personaldata'));

    response.renderTemplate('account/user/registration_edit', {
        bctext2 : dw.web.Resource.msg('account.editaccount', 'account', null),
        Action : 'edit'
    });
}

/**
 * Updates the profile of an authenticated customer. Does not clear the form
 * from previous attempt to keep the error messages. This is shown after an
 * update has failed.
 */
function EditProfileError()
{
    var TargetPipeline = 'Account-EditProfile';

    var Status = null;

    w.updatePageMetaDataForContent(dw.content.ContentMgr.getContent('myaccount-personaldata'));

    response.renderTemplate('account/user/registration_edit', {
        bctext2 : dw.web.Resource.msg('account.editaccount', 'account', null),
        Action : 'edit'
    });
}

function EditForm()
{
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'cancel')
        {
            session.forms.profile.clearFormElement();

            response.redirect(dw.web.URLUtils.https('Account-Show'));
            return;
        }
        else if (TriggeredAction.formId == 'confirm')
        {
            if (editAccount())
            {
                // success
                response.redirect(dw.web.URLUtils.https('Account-Show'));
                return;
            }
        }
    }

    response.redirect(dw.web.URLUtils.https('Account-EditProfileError'));
}

/**
 * Renders the password reset dialog.
 */
function PasswordResetDialog()
{
    f.clearFormElement(session.forms.requestpassword);

    response.renderTemplate('account/password/requestpasswordresetdialog');
}

/**
 * Handles the password reset form.
 */
function PasswordResetDialogForm()
{
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'cancel')
        {
            response.renderTemplate('account/password/requestpasswordresetdialog');
            return;
        }
        else if (TriggeredAction.formId == 'send')
        {
            var params = {};

            var GetCustomerResult = new dw.system.Pipelet('GetCustomer').execute({
                Login : session.forms.requestpassword.email.htmlValue
            });
            if (GetCustomerResult.result != PIPELET_ERROR)
            {
                var Customer = GetCustomerResult.Customer;

                var GenerateResetPasswordTokenResult = new dw.system.Pipelet('GenerateResetPasswordToken').execute({
                    Customer : Customer
                });
                var ResetPasswordToken = GenerateResetPasswordTokenResult.ResetPasswordToken;

                var m = require('./dw/mail');
                m.sendMail({
                    MailFrom : dw.system.Site.getCurrent().getCustomPreferenceValue('customerServiceEmail'),
                    MailSubject : dw.web.Resource.msg('email.passwordassistance', 'email', null),
                    MailTemplate : 'mail/resetpasswordemail',
                    MailTo : Customer.profile.email
                });

                params.ErrorCode = null;
                params.ShowContinue = true;

                response.renderTemplate('account/password/requestpasswordreset_confirm', params);
                return;
            }
        }
    }

    response.renderTemplate('account/password/requestpasswordresetdialog', {
        ErrorCode : 'formnotvalid'
    });
}

/**
 * Renders the password reset screen. This is very similar to the password reset
 * dialog but has screen-based interaction instead of popup interaction.
 */
function passwordReset()
{
    f.clearFormElement(session.forms.requestpassword);

    response.renderTemplate('account/password/requestpasswordreset');
}

/**
 * The form handler for password resets.
 */
function PasswordResetForm()
{
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'send')
        {
            var GetCustomerResult = new dw.system.Pipelet('GetCustomer').execute({
                Login : CurrentForms.requestpassword.email.htmlValue
            });
            if (GetCustomerResult.result == PIPELET_ERROR)
            {
                response.renderTemplate('account/password/requestpasswordreset', {
                    ErrorCode : 'notfounderror'
                });
                return;
            }
            var Customer = GetCustomerResult.Customer;

            var GenerateResetPasswordTokenResult = new dw.system.Pipelet('GenerateResetPasswordToken').execute({
                Customer : Customer
            });
            var ResetPasswordToken = GenerateResetPasswordTokenResult.ResetPasswordToken;

            var m = require('./dw/mail');
            m.sendMail({
                MailFrom : dw.system.Site.getCurrent().getCustomPreferenceValue('customerServiceEmail'),
                MailSubject : dw.web.Resource.msg('email.passwordassistance', 'email', null),
                MailTemplate : 'mail/resetpasswordemail',
                MailTo : Customer.profile.email
            });

            response.renderTemplate('account/password/requestpasswordreset_confirm', {
                ErrorCode : null
            });
            return;
        }
    }

    // TODO redirect
    response.renderTemplate('account/password/requestpasswordreset', {
        ErrorCode : 'formnotvalid'
    });
}

/**
 * Renders the screen for setting a new password. If token not valid, just
 * quietly forward to PasswordReset screen. This is the link sent by email.
 */
function SetNewPassword()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    f.clearFormElement(CurrentForms.resetpassword);

    if (CurrentHttpParameterMap.Token == null)
    {
        passwordReset();
        return;
    }

    var ValidateResetPasswordTokenResult = new dw.system.Pipelet('ValidateResetPasswordToken').execute({
        Token : CurrentHttpParameterMap.Token.getStringValue()
    });
    if (ValidateResetPasswordTokenResult.result == PIPELET_ERROR)
    {
        passwordReset();
        return;
    }
    var Customer = ValidateResetPasswordTokenResult.Customer;

    response.renderTemplate('account/password/setnewpassword');
}

function SetNewPasswordForm()
{
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'cancel')
        {
            response.renderTemplate('account/password/setnewpassword');
            return;
        }
        else if (TriggeredAction.formId == 'send')
        {
            // TODO redirects

            var ValidateResetPasswordTokenResult = new dw.system.Pipelet('ValidateResetPasswordToken').execute({
                Token : CurrentHttpParameterMap.Token.getStringValue()
            });
            if (ValidateResetPasswordTokenResult.result == PIPELET_ERROR)
            {
                passwordReset();
                return;
            }
            var Customer = ValidateResetPasswordTokenResult.Customer;

            if (CurrentForms.resetpassword.password.value != CurrentForms.resetpassword.passwordconfirm.value)
            {
                f.invalidateFormElement(CurrentForms.resetpassword.passwordconfirm);

                response.renderTemplate('account/password/setnewpassword');
                return;
            }

            var ResetCustomerPasswordWithTokenResult = new dw.system.Pipelet('ResetCustomerPasswordWithToken')
                    .execute({
                        Customer : Customer,
                        Token : CurrentHttpParameterMap.Token.stringValue,
                        Password : CurrentForms.resetpassword.password.htmlValue
                    });
            if (ResetCustomerPasswordWithTokenResult.result == PIPELET_ERROR)
            {
                response.renderTemplate('account/password/setnewpassword', {
                    ErrorCode : 'invalidpassworderror'
                });
                return;
            }

            var m = require('./dw/mail');
            m.sendMail({
                MailFrom : dw.system.Site.getCurrent().getCustomPreferenceValue('customerServiceEmail'),
                MailSubject : dw.web.Resource.msg('email.passwordassistance', 'email', null),
                MailTemplate : 'mail/passwordchangedemail',
                MailTo : Customer.profile.email
            });

            response.redirect(dw.web.URLUtils.https('Account-SetNewPasswordConfirm'));
            return;
        }
    }

    // TODO redirects
    response.renderTemplate('account/password/setnewpassword', {
        ErrorCode : 'formnotvalid'
    });
}

function SetNewPasswordConfirm()
{
    response.renderTemplate('account/password/setnewpassword_confirm', {});
}

/**
 * Start the customer registration process and renders customer registration
 * page.
 */
function StartRegister()
{
    var forms = session.forms;

    forms.profile.clearFormElement();

    if (forms.login.username.value != null)
    {
        forms.profile.customer.email.value = forms.login.username.value;
    }

    response.renderTemplate('account/user/registration');
}

// Originally, there is only one template account/user/registration
// with a form which triggers either the registration or the edit handler
// (depending on the pipeline which defines other continuations for the same
// template).
// Now, there are two templates:
// account/user/registration
// account/user/registration_edit
function RegistrationForm()
{
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'confirm')
        {
            if (!createAccount())
            {
                // TODO redirect
                response.renderTemplate('account/user/registration');
                return;
            }

            session.forms.profile.clearFormElement();

            // TODO originally there is a return to the calling pipeline
            // this is not possible anymore because we have not preserved the
            // callstack accross multiple requests
            response.redirect(dw.web.URLUtils.https('Account-Show', ['registration', true]));

            /*
            var LoginController = require('./Login');
            LoginController.Redirect({
                TargetPipeline : 'Account-Show',
                TargetPipelineParams : 'registration=true'
            });
            */
            return;
        }
    }

    response.renderTemplate('account/user/registration');
}


/**
 * This method contains the login procedure specific for the customer account,
 * e.g. order tracking. After login, it redirects to the provided target action.
 */
function requireLogin(args)
{
    var forms = session.forms;

    f.clearFormElement(forms.ordertrack);
    f.clearFormElement(forms.login);

    if (customer.registered)
    {
        forms.login.username.value = customer.profile.credentials.login;
        forms.login.rememberme.value = true;
    }

    w.updatePageMetaDataForContent(dw.content.ContentMgr.getContent('myaccount-login'));

    // set the redirect destination
    session.forms.login.targetAction.value = args.TargetAction;
    
    if (!empty(args.TargetParameters))
    {
        session.forms.login.targetParameters.value = JSON.stringify(args.TargetParameters);
    }
    
    response.renderTemplate('account/login/accountlogin', {
        RegistrationStatus : false
    });
}


function LoginForm()
{
    
	
var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'findorder')
        {
            var OrderController = require('./Order');
            var FindResult = OrderController.Find();
            if (FindResult.error)
            {
                // TODO redirect
                response.renderTemplate('account/login/accountlogin', {
                    OrderNotFound : true
                });
                return;
            }
            // TODO redirect
            response.renderTemplate('account/orderhistory/orderdetails', {
                Order : FindResult.Order
            });
            return;
        }
        else if (TriggeredAction.formId == 'login')
        {
            // get the target action which requested this login step before the
            // form is cleared
            var targetAction = session.forms.login.targetAction.value;
            var targetParameters = session.forms.login.targetParameters.value;

            var LoginController = require('./Login');
            var ProcessResult = LoginController.Process();
            if (ProcessResult.login_failed)
            {
                // TODO redirect
                response.renderTemplate('account/login/accountlogin');
                return;
            }

            // login successful
            // redirect to the origin who triggered the login process
            if (request.httpParameterMap.original.submitted) {
                //@TODO make sure only path, no hosts are allowed as redirect target 
            	response.redirect(decodeURI(request.httpParameterMap.original.value));
            } else if (!empty(targetAction)) {
                if (empty(targetParameters)) {
                    response.redirect(dw.web.URLUtils.https(targetAction));
                } else {
                    response.redirect(dw.web.URLUtils.https(targetAction, JSON.parse(targetParameters)));
                }
            } else {
                response.redirect(dw.web.URLUtils.https('Account-Show'));
            }
            return;
        }
        else if (TriggeredAction.formId == 'register')
        {
            response.redirect(dw.web.URLUtils.https('Account-StartRegister'));
            return;
        }
    }

    response.redirect(dw.web.URLUtils.https('Account-Show'));
}

/**
 * Renders the account navigation.
 */
function IncludeNavigation()
{
    response.renderTemplate('account/accountnavigation');
}

/**
 * Facebook Connect for registration
 */
function Connect()
{
    var CurrentForms = session.forms;

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError : 'PIPELET_ERROR',
        ScriptFile : 'account/user/connect.ds'
    }).execute();
    if (ScriptResult.result == PIPELET_ERROR)
    {
        if (RegistrationStatus.code == 'CustomerAlreadyExistError')
        {
            CurrentForms.login.username.value = FacebookUser.registration.email;

            f.invalidateFormElement(CurrentForms.login.loginsucceeded);

            /*
             * Used when user has attempted to use their facebook account to
             * create a storefront account that is already in the BM
             */
            response.renderTemplate('account/login/accountlogin', {
                TargetPipeline : 'Account-Show',
                RegistrationStatus: RegistrationStatus
            });
            return;
        }

        // TODO where to go from here?
        response.redirect(dw.web.URLUtils.https('Account-Show'));
        //var LoginController = require('./Login');
        //LoginController.Redirect({});
        return;
    }
    var FacebookJSON = ScriptResult.FacebookJSON;
    var FacebookUser = ScriptResult.FacebookUser;
    var RegistrationStatus = ScriptResult.RegistrationStatus;

    if (!createAccount())
    {
        response.redirect(dw.web.URLUtils.https('Account-StartRegister'));
        return;
    }

    response.redirect(dw.web.URLUtils.https('Account-Show'));
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Show                    = g.httpsGet(loggedIn(Show));
exports.EditProfile             = g.httpsGet(loggedIn(EditProfile));
exports.EditProfileError        = g.httpsGet(loggedIn(EditProfileError));
exports.EditForm                = g.httpsPost(loggedIn(EditForm));
exports.PasswordResetDialog     = g.httpsGet(PasswordResetDialog);
exports.PasswordResetDialogForm = g.httpsPost(PasswordResetDialogForm);
exports.PasswordResetForm       = g.httpsPost(PasswordResetForm);
exports.SetNewPassword          = g.httpsGet(SetNewPassword);
exports.SetNewPasswordForm      = g.httpsPost(SetNewPasswordForm);
exports.SetNewPasswordConfirm   = g.httpsGet(SetNewPasswordConfirm);
exports.StartRegister           = g.httpsGet(StartRegister);
exports.RegistrationForm        = g.httpsPost(RegistrationForm);
exports.LoginForm               = g.httpsPost(LoginForm);
exports.IncludeNavigation       = g.get(IncludeNavigation);
exports.Connect                 = g.https(Connect);

/*
 * Internal methods
 */
exports.requireLogin = requireLogin;
