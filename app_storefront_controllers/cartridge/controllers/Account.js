'use strict';

/**
 * This controller provides functions that render the account overview, manage customer registration and password reset,
 * and edit customer profile information.
 *
 * @module controllers/Account
 */

/* API includes */
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Renders the account overview.
 */
function show() {
    var accountHomeAsset, pageMeta, Content;

    Content = app.getModel('Content');
    accountHomeAsset = Content.get('myaccount-home');

    pageMeta = require('~/cartridge/scripts/meta');
    pageMeta.update(accountHomeAsset);

    app.getView().render('account/accountoverview');
}

/**
 * Updates the profile of an authenticated customer.
 */
function editProfile() {
    var Content, pageMeta, accountPersonalDataAsset;
    Content = app.getModel('Content');

    if (!request.httpParameterMap.invalid.submitted) {
        app.getForm('profile').clear();

        app.getForm('profile.customer').copyFrom(customer.profile);
        app.getForm('profile.login').copyFrom(customer.profile.credentials);
        app.getForm('profile.addressbook.addresses').copyFrom(customer.profile.addressBook.addresses);
    }
    accountPersonalDataAsset = Content.get('myaccount-personaldata');

    pageMeta = require('~/cartridge/scripts/meta');
    pageMeta.update(accountPersonalDataAsset);
    // @FIXME bctext2 should generate out of pagemeta - also action?!
    app.getView({
        bctext2: Resource.msg('account.user.registration.editaccount', 'account', null),
        Action: 'edit',
        ContinueURL: URLUtils.https('Account-EditForm')
    }).render('account/user/registration');
}

/**
 * Handles the form submission on profile update of edit profile.
 */
function editForm() {
    app.getForm('profile').handleAction({
        cancel: function () {
            app.getForm('profile').clear();
            response.redirect(URLUtils.https('Account-Show'));
        },
        confirm: function () {
            var Customer, profileUpdateValidation;
            Customer = app.getModel('Customer');
            if (!Customer.checkUserName()) {
                app.getForm('profile.customer.email').invalidate();
                profileUpdateValidation = false;
            }

            if (app.getForm('profile.customer.email').value() !== app.getForm('profile.customer.emailconfirm').value()) {
                app.getForm('profile.customer.emailconfirm').invalidate();
                profileUpdateValidation = false;
            }

            if (app.getForm('profile.login.password').value() !== app.getForm('profile.login.passwordconfirm').value()) {
                app.getForm('profile.login.passwordconfirm').invalidate();
                profileUpdateValidation = false;
            }

            if (profileUpdateValidation) {
                profileUpdateValidation = Customer.editAccount(app.getForm('profile.customer.email').value(), app.getForm('profile.login.password').value(), app.getForm('profile'));
            }

            if (profileUpdateValidation) {
                response.redirect(URLUtils.https('Account-Show'));
            } else {
                response.redirect(URLUtils.https('Account-EditProfile', 'invalid', 'true'));
            }
        }
    });
}

/**
 * Renders the password reset screen. This is very similar to the password reset
 * dialog but has a screen-based interaction instead of a popup interaction.
 */
function passwordReset() {
    app.getForm('requestpassword').clear();
    app.getView({
        ContinueURL: URLUtils.https('Account-PasswordResetForm')
    }).render('account/password/requestpasswordreset');
}

/**
 * Utility that handles form submission from dialog and full page
 *  password reset.
 * @private
 */
function passwordResetFormHandler(templateName, continueURL) {
    var resetPasswordToken, passwordemail;

    app.getForm('profile').handleAction({
        cancel: function () {
            app.getView({
                ContinueURL: continueURL
            }).render(templateName);
        },
        send: function () {
            var Customer, resettingCustomer, Email;
            Customer = app.getModel('Customer');
            Email = app.getModel('Email');
            resettingCustomer = Customer.getCustomerByLogin(session.forms.requestpassword.email.htmlValue);

            if (!empty(resettingCustomer)) {
                resetPasswordToken = resettingCustomer.generatePasswordResetToken();

                passwordemail = Email.get('mail/resetpasswordemail', resettingCustomer.object.profile.email);
                passwordemail.setSubject(Resource.msg('email.passwordassistance', 'email', null));
                passwordemail.send({
                    ResetPasswordToken: resetPasswordToken
                });

                app.getView({
                    ErrorCode: null,
                    ShowContinue: true,
                    ContinueURL: continueURL
                }).render('account/password/requestpasswordreset_confirm');
            } else {
                app.getView({
                    ErrorCode: 'formnotvalid',
                    ContinueURL: continueURL
                }).render(templateName);
            }
        },
        error: function () {
            app.getView({
                ErrorCode: 'formnotvalid',
                ContinueURL: continueURL
            }).render(templateName);
        }
    });
}

/**
 * The form handler for password resets.
 */
function passwordResetForm() {
    passwordResetFormHandler('account/password/requestpasswordreset', URLUtils.https('Account-PasswordResetForm'));
}

/**
 * Renders the password reset dialog.
 */
function passwordResetDialog() {
    // @FIXME reimplement using dialogify
    app.getForm('requestpassword').clear();
    app.getView({
        ContinueURL: URLUtils.https('Account-PasswordResetDialogForm')
    }).render('account/password/requestpasswordresetdialog');
}

/**
 * Handles the password reset form.
 */
function passwordResetDialogForm() {
    // @FIXME reimplement using dialogify
    passwordResetFormHandler('account/password/requestpasswordresetdialog', URLUtils.https('Account-PasswordResetDialogForm'));
}

/**
 * Renders the screen for setting a new password. If token not valid, just
 * quietly forward to PasswordReset screen. This is the link sent by email.
 */
function setNewPassword() {
    var Customer, resettingCustomer;
    Customer = app.getModel('Customer');

    app.getForm('resetpassword').clear();
    resettingCustomer = Customer.getByPasswordResetToken(request.httpParameterMap.Token.getStringValue());

    if (empty(resettingCustomer)) {
        response.redirect(URLUtils.https('Account-PasswordReset'));
    } else {
        app.getView({
            ContinueURL: URLUtils.https('Account-SetNewPasswordForm')
        }).render('account/password/setnewpassword');
    }
}

/**
 * Handles the set new password form submit
 */
function setNewPasswordForm() {

    app.getForm('profile').handleAction({
        cancel: function () {
            app.getView({
                ContinueURL: URLUtils.https('Account-SetNewPasswordForm')
            }).render('account/password/setnewpassword');
            return;
        },
        send: function () {
            var resettingCustomer, success, passwordchangedmail, Customer, Email;

            Customer = app.getModel('Customer');
            Customer = app.getModel('Email');
            resettingCustomer = Customer.getByPasswordResetToken(request.httpParameterMap.Token.getStringValue());

            if (empty(resettingCustomer)) {
                response.redirect(URLUtils.https('Account-PasswordReset'));
            } else {

                if (app.getForm('resetpassword.password').value() !== app.getForm('resetpassword.passwordconfirm').value()) {
                    app.getForm('resetpassword.passwordconfirm').invalidate();
                    app.getView({
                        ContinueURL: URLUtils.https('Account-SetNewPasswordForm')
                    }).render('account/password/setnewpassword');
                } else {

                    success = resettingCustomer.resetPasswordByToken(request.httpParameterMap.Token.getStringValue(), app.getForm('resetpassword.password').value());
                    if (!success) {
                        app.getView({
                            ErrorCode: 'formnotvalid',
                            ContinueURL: URLUtils.https('Account-SetNewPasswordForm')
                        }).render('account/password/setnewpassword');
                    } else {
                        passwordchangedmail = Email.get('mail/passwordchangedemail', resettingCustomer.object.profile.email);
                        passwordchangedmail.setSubject(Resource.msg('email.passwordassistance', 'email', null));
                        passwordchangedmail.send({});

                        app.getView().render('account/password/setnewpassword_confirm');
                    }
                }
            }
        }
    });
}

/**
 * Start the customer registration process and renders customer registration
 * page.
 */
function startRegister() {

    app.getForm('profile').clear();

    if (app.getForm('login.username').value() !== null) {
        app.getForm('profile.customer.email').object.value = app.getForm('login.username').object.value;
    }

    app.getView({
        ContinueURL: URLUtils.https('Account-RegistrationForm')
    }).render('account/user/registration');
}

/**
 * Handles registration form submit
 */
function registrationForm() {
    app.getForm('profile').handleAction({
        confirm: function () {
            var email, emailConfirmation, profileValidation, password, passwordConfirmation, existingCustomer, Customer, target;

            Customer = app.getModel('Customer');
            email = app.getForm('profile.customer.email').value();
            emailConfirmation = app.getForm('profile.customer.emailconfirm').value();
            profileValidation = true;

            if (email !== emailConfirmation) {
                app.getForm('profile.customer.emailconfirm').invalidate();
                profileValidation = false;
            }

            password = app.getForm('profile.login.password').value();
            passwordConfirmation = app.getForm('profile.login.passwordconfirm').value();

            if (password !== passwordConfirmation) {
                app.getForm('profile.login.passwordconfirm').invalidate();
                profileValidation = false;
            }

            // check if login is already taken
            existingCustomer = Customer.getCustomerByLogin(email);
            if (existingCustomer !== null) {
                app.getForm('profile.customer.email').invalidate();
                profileValidation = false;
            }

            if (profileValidation) {
                profileValidation = Customer.createAccount(email, password, app.getForm('profile'));
            }

            if (!profileValidation) {
                // TODO redirect
                app.getView({
                    ContinueURL: URLUtils.https('Account-RegistrationForm')
                }).render('account/user/registration');
            } else {
                app.getForm('profile').clear();
                target = session.custom.TargetLocation;
                if (target) {
                    delete session.custom.TargetLocation;
                    //@TODO make sure only path, no hosts are allowed as redirect target
                    dw.system.Logger.info('Redirecting to "{0}" after successful login', target);
                    response.redirect(target);
                } else {
                    response.redirect(URLUtils.https('Account-Show', 'registration', 'true'));
                }
            }
        }
    });
}

/**
 * Renders the account navigation.
 */
function includeNavigation() {
    app.getView().render('account/accountnavigation');
}

/* Web exposed methods */

/** @see module:controllers/Account~Show */
exports.Show = guard.ensure(['get', 'https', 'loggedIn'], show);
/** @see module:controllers/Account~EditProfile */
exports.EditProfile = guard.ensure(['get', 'https', 'loggedIn'], editProfile);
/** @see module:controllers/Account~EditForm */
exports.EditForm = guard.ensure(['post', 'https', 'loggedIn'], editForm);
/** @see module:controllers/Account~PasswordResetDialog */
exports.PasswordResetDialog = guard.ensure(['get', 'https'], passwordResetDialog);
/** @see module:controllers/Account~PasswordReset */
exports.PasswordReset = guard.ensure(['get', 'https'], passwordReset);
/** @see module:controllers/Account~PasswordResetDialogForm */
exports.PasswordResetDialogForm = guard.ensure(['post', 'https'], passwordResetDialogForm);
/** @see module:controllers/Account~PasswordResetForm */
exports.PasswordResetForm = guard.ensure(['post', 'https'], passwordResetForm);
/** @see module:controllers/Account~SetNewPassword */
exports.SetNewPassword = guard.ensure(['get', 'https'], setNewPassword);
/** @see module:controllers/Account~SetNewPasswordForm */
exports.SetNewPasswordForm = guard.ensure(['post', 'https'], setNewPasswordForm);
/** @see module:controllers/Account~StartRegister */
exports.StartRegister = guard.ensure(['https'], startRegister);
/** @see module:controllers/Account~RegistrationForm */
exports.RegistrationForm = guard.ensure(['post', 'https'], registrationForm);
/** @see module:controllers/Account~IncludeNavigation */
exports.IncludeNavigation = guard.ensure(['get'], includeNavigation);
