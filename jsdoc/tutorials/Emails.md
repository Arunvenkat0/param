In various places throughout the application emails are being sent to notify the customer about certain events. By default those emails are being sent by the Demandware system and usually they are sent from a common email address like _customer.service@mydomain.com_. In order to make sending emails as easy as possible the [Email]{@see module:model/Email} module provides easy to use convenience methods.

```
// sending a simple welcome email
equire('~/model/Email').get('mail/welcome',Customer.profile.email).send();

// send an email to a customer's mail address providing additional data for the email template
require('~/model/Email').get('mail/resetpasswordemail',Customer.profile.email)
    .setSubject(dw.web.Resource.msg('email.passwordassistance', 'email', null)).send({
        Customer : Customer,
        ResetPasswordToken : ResetPasswordToken
    });
```

### Sending Emails via a 3rd party service

As all emails are send via the [Email]{@see module:model/Email} module, the 3rd party integration can hook into it's send method to i.e. call a service using the _dw.svc.*_ APIs.