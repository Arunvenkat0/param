'use strict';
/**
 * Model for account functionality.
 *
 * @module models/AccountModel
 */

/* API Includes */
var AbstractModel = require('./AbstractModel');
var Transaction = require('dw/system/Transaction');
var Form = require('~/cartridge/scripts/models/FormModel');

/**
 * Account helper providing enhanced account functionality.Provides methods to manage customers and accounts.
 * @class module:models/AccountModel~AccountModel
 */
var AccountModel = AbstractModel.extend(
    /**
     * @lends module:models/AccountModel~AccountModel.prototype
     */
    {
        /**
         * Looks up a customer by login.
         * @alias module:models/AccountModel~AccountModel/getCustomerByLogin
         * @param {String} login The customer username for login.
         * @return {dw.customer.Customer} The customer with the given login username.
         */
        getCustomerByLogin: function (login) {
            var GetCustomerResult = new dw.system.Pipelet('GetCustomer').execute({
                Login: login
            });
            if (GetCustomerResult.result === PIPELET_ERROR) {
                return null;
            }

            return GetCustomerResult.Customer;
        },

        /**
         * Creates a customer.
         * @alias module:models/AccountModel~AccountModel/createCustomer
         * @param {String} login The customer username for login.
         * @param {String} password The customer password for login.
         * @return {dw.customer.Customer | null} The customer created by the method or null if the customer was not created.
         */
        createCustomer: function (login, password) {
            var CreateCustomerResult = new dw.system.Pipelet('CreateCustomer').execute({
                Login: login,
                Password: password
            });
            if (CreateCustomerResult.result === PIPELET_ERROR) {
                return null;
            }

            return CreateCustomerResult.Customer;
        },

        /**
         * Sets the customer's login.
         *
         * @param {dw.customer.Customer} customer The customer login to set.
         * @param {String} login The customer username for login.
         * @param {String} password The customer password for login.
         * @alias module:models/AccountModel~AccountModel/setLogin
         * @return {Boolean} true if the login and password was updated, false if it was not or if any of the input parameters were set to null.
         */
        setLogin: function (customer, login, password) {
            if ((customer === null) || (login === null) || (password === null)) {
                return false;
            }

            return customer.profile.credentials.setLogin(login, password);
        },

        /**
         * Logs in a customer.
         *
         * @param {String} login The customer username for login.
         * @param {String} password The customer password for login.
         * @param {Boolean} rememberMe true if the customer wants to be remembered on the current computer.
         * If set to True a cookie identifying the customer is stored upon successful login for 180 days.
         * If set to False, or a null value, then no cookie is stored and any existing cookie is removed.
         * @alias module:models/AccountModel~AccountModel/setLogin
         * @return {Boolean} true if the login and password was updated, false if it was not or if any of the input parameters were set to null.
         */
        loginCustomer: function (login, password, rememberMe) {
            var LoginCustomerResult = new dw.system.Pipelet('LoginCustomer').execute({
                Login: login,
                Password: password,
                RememberMe: rememberMe
            });

            return (LoginCustomerResult.result !== PIPELET_ERROR);
        },

        /**
         * Creates a new customer account and logs the customer in.
         *
         * @alias module:models/AccountModel~AccountModel/createAccount
         * @transactional
         * @return true if the account is created successfully, false otherwise.
         */
        createAccount: function () {
            var profileForm = session.forms.profile;

            var email = profileForm.customer.email.value;
            var emailConfirmation = profileForm.customer.emailconfirm.value;

            if (email !== emailConfirmation) {
                profileForm.customer.emailconfirm.invalidateFormElement();
                return false;
            }

            var password = profileForm.login.password.value;
            var passwordConfirmation = profileForm.login.passwordconfirm.value;

            if (password !== passwordConfirmation) {
                profileForm.login.passwordconfirm.invalidateFormElement();
                return false;
            }

            // Checks if login is already taken.
            var existingCustomer = this.getCustomerByLogin(email);
            if (existingCustomer !== null) {
                profileForm.customer.email.invalidateFormElement();
                return false;
            }

            Transaction.begin();

            // Creates the new customer.
            var newCustomer = this.createCustomer(email, password);
            if (newCustomer === null) {
                Transaction.rollback();
                profileForm.invalidateFormElement();
                return false;
            }

            if (!Form.get(profileForm.customer).copyTo(newCustomer.profile)) {
                Transaction.rollback();
                profileForm.invalidateFormElement();
                return false;
            }

            email = profileForm.customer.email.value;
            password = profileForm.login.password.value;

            // Sets the login and password.
            if (!this.setLogin(newCustomer, email, password)) {
                Transaction.rollback();
                profileForm.invalidateFormElement();
                return false;
            }

            Transaction.commit();

            Form.get(session.forms.login).copyTo(newCustomer.profile.credentials);

            var login = profileForm.customer.email.value;
            password = profileForm.login.password.value;
            var rememberMe = profileForm.login.rememberme.value;

            // Logs in the customer.
            return this.loginCustomer(login, password, rememberMe);
        },

        /**
         * Checks whether a user name on exists.
         * @alias module:models/AccountModel~AccountModel/checkUserName
         * @return {Boolean} true if the user name exists.
         */
        checkUserName: function () {
            var profileForm = session.forms.profile;

            if (customer.profile.credentials.login === profileForm.customer.email.value) {
                return true;
            }

            var GetCustomerResult = new dw.system.Pipelet('GetCustomer').execute({
                Login: profileForm.customer.email.value
            });
            if (GetCustomerResult.result === PIPELET_ERROR) {
                return true;
            }

            return false;
        },

        /**
         * Edits a customer account.
         *
         * @alias module:models/AccountModel~AccountModel/editAccount
         * @transactional
         * @return true if the customer account is successfully updated.
         */
        editAccount: function () {
            var profileForm = session.forms.profile;

            if (!this.checkUserName()) {
                profileForm.customer.email.invalidateFormElement();
                return false;
            }

            if (profileForm.customer.email.value !== profileForm.customer.emailconfirm.value) {
                profileForm.customer.emailconfirm.invalidateFormElement();
                return false;
            }

            if (profileForm.login.password.value !== profileForm.login.passwordconfirm.value) {
                profileForm.login.passwordconfirm.invalidateFormElement();
                return false;
            }

            profileForm.login.username.value = profileForm.customer.email.value;

            Transaction.begin();

            if (!this.setLogin(customer, profileForm.customer.email.value, profileForm.login.password.value)) {
                Transaction.rollback();
                return false;
            }

            var SetCustomerPasswordResult = new dw.system.Pipelet('SetCustomerPassword').execute({
                Password: profileForm.login.password.value,
                Customer: customer
            });
            if (SetCustomerPasswordResult.result === PIPELET_ERROR) {
                Transaction.rollback();
                return false;
            }

            if (!Form.get(profileForm.customer).copyFromcustomer.profile()) {
                Transaction.rollback();
                return false;
            }

            Transaction.commit();

            profileForm.clearFormElement();

            return true;
        }

    });

/** The account class */
module.exports = new AccountModel();
