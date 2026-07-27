// 和主工程 code/store/useEnvStore.ts / code/components/panels/SdkConfigPanel.tsx 的 sandbox 预设保持一致。
// 单点维护：改账号/密钥只改这一个文件，所有 single-page-test 页面共用。
export const ACCOUNTS = {
    C2: {
        label: "C2 Acct (China)",
        clientId:
            "ATW2maVlMXBh67xRprsLYttNFXVCDO7MhEUE_VId1zbwqSSfYfIAC8mtdLaLRwA4nZpTzGBZPws7Kf-Z",
        secret:
            "ELYFWy2PauSftn1lFaTkqsUd2sDu_gPrOi3cGOGj_6JyORnlG46cp16oBnLLmpBBQuhxQIKIiOIwCu_D",
    },
    US: {
        label: "US Acct (默认预设)",
        clientId:
            "Aa9Fj_yJs0Ylv2ZxdwWd-5ATa8vNqnn8ykMXksfwk5TRR0zvu1XoTZRhrAvI5YtnyaIJrFSanfQUq-9O",
        secret:
            "ELMHpqnP61kMOWIiz0NF-xKTmBXehYcgl6fv5VVJOpe_Usm57VCnjosY0tD78dAVo2CXglhQ4GVJql87",
    },
    SHOPPAAS: {
        label: "Shoppaas",
        clientId:
            "ATIwW9NdRH9Nqde8MCftI_0QbOL9APdYok0a7ircWl2-3fBHv-CoMYsfIDpcUDisqTHmHT7d0Dz9DV7V",
        secret:
            "EC-Qcp-6LdYoEw9g02iTkVTRHa49c_HLP19P2hxbSHATN3cov2_G-wmFzp5-Cx2gK3phIzrKhOhbLhPJ",
    },
    
    SHOPPAAS_AUTH_ASSERTION_ORIGIN: {
        label: "Shoppaas + Auth Assertion + Origin",
        clientId:
            "ATIwW9NdRH9Nqde8MCftI_0QbOL9APdYok0a7ircWl2-3fBHv-CoMYsfIDpcUDisqTHmHT7d0Dz9DV7V",
        secret:
            "EC-Qcp-6LdYoEw9g02iTkVTRHa49c_HLP19P2hxbSHATN3cov2_G-wmFzp5-Cx2gK3phIzrKhOhbLhPJ",
        authAssertion:
            "eyJhbGciOiJub25lIn0=.eyJpc3MiOiJBVEl3VzlOZFJIOU5xZGU4TUNmdElfMFFiT0w5QVBkWW9rMGE3aXJjV2wyLTNmQkh2LUNvTVlzZklEcGNVRGlzcVRIbUhUN2QwRHo5RFY3ViIsInBheWVyX2lkIjoiVlRUTVRZUU5GNjI4VSJ9.",
    },


    SHOPPAAS_AUTH_ASSERTION_CMHAMMNAXCMGA: {
        label: "Shoppaas + Auth Assertion + CMHAMMNAXCMGA",
        clientId:
            "ATIwW9NdRH9Nqde8MCftI_0QbOL9APdYok0a7ircWl2-3fBHv-CoMYsfIDpcUDisqTHmHT7d0Dz9DV7V",
        secret:
            "EC-Qcp-6LdYoEw9g02iTkVTRHa49c_HLP19P2hxbSHATN3cov2_G-wmFzp5-Cx2gK3phIzrKhOhbLhPJ",
        
        authAssertion: `${btoa('{"alg":"none"}')}.${btoa('{"iss":"ATIwW9NdRH9Nqde8MCftI_0QbOL9APdYok0a7ircWl2-3fBHv-CoMYsfIDpcUDisqTHmHT7d0Dz9DV7V","payer_id":"CMHAMMNAXCMGA"}')}.`,
      
    },

    //新sandbox测试账号, us-acct-with-no-eur@test.com
    //pwd: 12345678
    //merchant-id: us-acct-with-no-eur@test.com
    // Onboard completed
     SHOPPAAS_AUTH_ASSERTION_UEVX8LK4Y7TLA: {
        label: "Shoppaas + Auth Assertion + UEVX8LK4Y7TLA",
        clientId:
            "ATIwW9NdRH9Nqde8MCftI_0QbOL9APdYok0a7ircWl2-3fBHv-CoMYsfIDpcUDisqTHmHT7d0Dz9DV7V",
        secret:
            "EC-Qcp-6LdYoEw9g02iTkVTRHa49c_HLP19P2hxbSHATN3cov2_G-wmFzp5-Cx2gK3phIzrKhOhbLhPJ",
        
        authAssertion: `${btoa('{"alg":"none"}')}.${btoa('{"iss":"ATIwW9NdRH9Nqde8MCftI_0QbOL9APdYok0a7ircWl2-3fBHv-CoMYsfIDpcUDisqTHmHT7d0Dz9DV7V","payer_id":"UEVX8LK4Y7TLA"}')}.`,
      
    },
};
