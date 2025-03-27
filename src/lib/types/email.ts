export type Email = {
    'forgot-password': {
        link: string;
        supportEmail: string;
    };
'goodbye': {
        resubscribe: string;
    };
'test': {
        service: string;
        link: string;
        linkText: string;
    };
'welcome': {
        name: string;
        url: string;
        unsubscribe: string;
    };

};