export async function request_yoshi() {

    let a = await fetch("https://x.com/i/api/graphql/lab_lGirtVopc4lgPFX73w/UserMedia?variables=%7B%22userId%22%3A%221548497164539949056%22%2C%22count%22%3A20%2C%22includePromotedContent%22%3Afalse%2C%22withClientEventToken%22%3Afalse%2C%22withBirdwatchNotes%22%3Afalse%2C%22withVoice%22%3Atrue%7D&features=%7B%22rweb_video_screen_enabled%22%3Afalse%2C%22payments_enabled%22%3Afalse%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22premium_content_api_read_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22responsive_web_grok_analyze_button_fetch_trends_enabled%22%3Afalse%2C%22responsive_web_grok_analyze_post_followups_enabled%22%3Atrue%2C%22responsive_web_jetfuel_frame%22%3Afalse%2C%22responsive_web_grok_share_attachment_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22responsive_web_grok_show_grok_translated_post%22%3Afalse%2C%22responsive_web_grok_analysis_button_from_backend%22%3Atrue%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_grok_image_annotation_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D&fieldToggles=%7B%22withArticlePlainText%22%3Afalse%7D", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.7",
            "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
            "content-type": "application/json",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Brave\";v=\"138\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "sec-gpc": "1",
            "x-client-transaction-id": "kGMjzwJ+HgfrPpm3E1SPPrO2o5IicIiSpX1fWbQ/kruEKqvMKkkSJtuZf7I/R/uKkTtgg5Ra9nimoq/qbzjMd5C67P2skw",
            "x-csrf-token": "16ff6dc9285ea9c1f4b1e458c0cffc802f5ff2f208b7d42f932770f71bb62b83d8f133ed0dc9fb7bdf44c540d85818e0c29e6f85996bb260849065533a2e5a013b22b9f0fa4dcc75cd29f9631df3f75a",
            "x-twitter-active-user": "yes",
            "x-twitter-auth-type": "OAuth2Session",
            "x-twitter-client-language": "en",
            "x-xp-forwarded-for": "d7a716b16ef860e63979d0fc80299ee23b95a8aa1486087d68dfca31f9480840a45daefc6d3d7ab99bea2ea2cdc697ebd13d89d2496bf584f24940e4669698b71cd05517f38a432ae516dd9f945959194686ac6fd6af03ef6321da9597a399db059aaeff253cd8e80ad16902ccd2a4ad1167f34485254a5e3dc93e3de4270e389a7895c71195f677f48cba8c3b28c99de4407025739910080c7e034214789f08556314423b15f485c1a309256958ea59226098f916380a903e61f73a9a0e8be31caa376344e0da9427456353b9ad41d5baec251505aa9d9d71ab0032566ab68a33516dd2b680de95a8775d18f2b9ef54175d9379147490433b73e6",
            "cookie": "guest_id=v1%3A174330296444110671; guest_id_marketing=v1%3A174330296444110671; guest_id_ads=v1%3A174330296444110671; kdt=CgIjpe4x3Qsggt31osrTJvKG77vnxGa9nBNfQumY; auth_token=3c2c0df43177def9d1634b2f797446ba8e3d80da; ct0=16ff6dc9285ea9c1f4b1e458c0cffc802f5ff2f208b7d42f932770f71bb62b83d8f133ed0dc9fb7bdf44c540d85818e0c29e6f85996bb260849065533a2e5a013b22b9f0fa4dcc75cd29f9631df3f75a; twid=u%3D1070023533856739328; personalization_id=\"v1_Jvbicaysf2y9lP8Fh1UugA==\"; d_prefs=MjoxLGNvbnNlbnRfdmVyc2lvbjoyLHRleHRfdmVyc2lvbjoxMDAw; lang=en; external_referer=padhuUp37zgeCAGMzhY%2BsFHe2aGXYBFz|0|S38otfNfzYt86Dak8Eqj76tqscUAnK6Lq4vYdCl5zxIvK6QAA8vRkA%3D%3D; __cf_bm=lBjNKdpDV7xZPJ9bPpoUF1jp799RcIhxavhTZfIzED0-1751339872-1.0.1.1-vsg502VeGUFJSlt7b0DoaWhPDzBJ3D56kwt9MQmYuP1LGPdauAnmLzdIEtLWB8WiAYe9aZ13puLMq4AGh.zY.n6fNr4D4HbF_whb6GihNfA",
            "Referer": "https://x.com/yoshi9467/media?s=21&t=25uzmpJu4ex2oMLljd-sWA"
        },
        "body": null,
        "method": "GET"
    });

    let body = await a.json()
    return body
}