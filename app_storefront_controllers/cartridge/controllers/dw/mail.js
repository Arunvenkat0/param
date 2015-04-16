/**
 * This module provides methods for sending mails.
 */

exports.sendMail = function(mail)
{
    var MailFrom = mail.MailFrom;
    var MailSubject = mail.MailSubject;
    var MailTemplate = mail.MailTemplate;
    var MailTo = mail.MailTo;
    var MailCC = mail.MailCC;
    var MailBCC = mail.MailBCC;
    var LocaleID = mail.LocaleID;
    
    if (empty(MailFrom) || empty(MailSubject) || empty(MailTemplate) || empty(MailTo))
    {
        return false;
    }
    
    new dw.system.Pipelet('SendMail').execute({
        MailFrom: MailFrom,
        MailTemplate: MailTemplate,
        MailTo: MailTo,
        MailSubject: MailSubject,
        MailCC: MailCC,
        MailBCC: MailBCC,
        LocaleID: LocaleID
    });
    
    return true;
};
