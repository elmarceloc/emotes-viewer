// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
function returnResponse(response) {
    return response.json();
}

function logError(error) {
    console.log(error.message);
}


Vue.createApp({
    data() {
      return {
        search: '',
        channel: 'xqcow',
        channelID: '',
        ffz: [],
        bttv: [],
        seventv: [],
        subTiers: [],
        badges: [],
        errored: false,
        tab:'emotes'
      }
    },
    methods: {
        onSearch: function() {
            this.channel = this.search
            this.getChannelData(this.channel)
        },
        getChannelData: async function(channel) {

            this.errored = false

            this.ffz = []
            this.bttv = []
            this.seventv = []
            this.badges = []
            this.subTiers = []

            // get channel twitch ID
            let res = await fetch("https://api.ivr.fi/twitch/resolve/" + channel, {
                method: "GET",
                headers: { "User-Agent": "api.roaringiron.com/emoteoverlay" },
            }).then(returnResponse, logError);
            if (!res.error || res.status == 200) {
                this.channelID = res.id;
            } else {
                this.errored = true
                return
            }

            // get twitch badges

            res = await fetch(`https://badges.twitch.tv/v1/badges/channels/${this.channelID}/display`, {
                method: "GET",
                headers: { "User-Agent": "api.roaringiron.com/emoteoverlay" },
            }).then(returnResponse, logError);
            if (!res.error || res.status == 200) {
                this.badges = getChannelBadges(res)
                console.log(this.badges)
            } else {
                this.errored = true
                return
            }

            // get twitch sub emotes
            res = await fetch("https://api.ivr.fi/twitch/allemotes/" + channel, {
                method: "GET",
            }).then(returnResponse, logError);
            // loop every sub tier
            var subTiers = []
            if(res.subEmotes){

                res.subEmotes.forEach((emoteTier, i) => {
                        
                    subTiers[i] = {
                        name: emoteTier.displayName,
                        emotes: []
                    }
                    
                    // for every tier, look up the emotes
                    for (var j = 0; j < emoteTier.emotes.length; j++) {
                        let emote = {
                            id: emoteTier.emotes[j].id,
                            name: emoteTier.emotes[j].code,
                        };
                        
                        subTiers[i].emotes.push(emote);
                    }
                });
            }

            this.subTiers = subTiers
            console.log(subTiers)


            // get FFZ emotes
            res = await fetch("https://api.frankerfacez.com/v1/room/" + channel, {
                method: "GET",
            }).then(returnResponse, logError);

            if (!res.error) {
                this.ffz = getFFZemotes(res.sets)
            } else {
                
            }

            // get all BTTV emotes
            res = await fetch("https://api.betterttv.net/3/cached/users/twitch/" + this.channelID, {
                method: "GET",
            }).then(returnResponse, logError);
            if (!res.message) {
                this.bttv = getBttvEmotes(res.channelEmotes)
                this.bttv = getBttvEmotes(res.sharedEmotes)
            } else {
                
            }

            // get all 7TV emotes
            res = await fetch( `https://api.7tv.app/v2/users/${channel}/emotes`, {
                method: "GET",
            }).then(returnResponse, logError);
            if (!res.error || res.status == 200) {
                if (res.Status === 404) {
                    
                } else {
                    let emotes = []
                    for (var i = 0; i < res.length; i++) {
                        let emote = {
                            name: res[i].name,
                            id: res[i].id,
                            img: res[i].urls[1][1],
                        };
                        emotes.push(emote);
                    }
                    this.seventv = emotes
                }
            }
        }
    },
    async mounted() {
        this.getChannelData(this.channel)
    
    }
  }).mount('#app')


function getEmote(name, img, id){
    let emote = {
        name: name,
        img: img,
        id: id
    };
    return emote
}

function getFFZemotes(sets){
    let emotes = []

    let setName = Object.keys(sets);
    for (var k = 0; k < setName.length; k++) {
        for (var i = 0; i < sets[setName[k]].emoticons.length; i++) {
            const emoteURL = sets[setName[k]].emoticons[i].urls["4"] ? sets[setName[k]].emoticons[i].urls["4"] : sets[setName[k]].emoticons[i].urls["1"];
            console.log('ffz',sets[setName[k]].emoticons[i])
            const name = sets[setName[k]].emoticons[i].name
            const id = sets[setName[k]].emoticons[i].id
            const img = "https://" + emoteURL.split("//").pop()

            const emote = getEmote(name, img, id)
            emotes.push(emote)
        }
    }
    return emotes
}

function getBttvEmotes(group){
    let emotes = []
    for (var i = 0; i < group.length; i++) {
        const name = group[i].code;
        const img = `https://cdn.betterttv.net/emote/${group[i].id}/3x`
        const id = group[i].id

        const emote = getEmote(name, img, id)
        emotes.push(emote)
    }
    return emotes
}

function getChannelBadges(badges){
    let channelBadges = []
    if(badges && badges.badge_sets){
        if(!isEmpty(badges.badge_sets)){

            // iterates trow every badge object and adds it to the channelBadges array
            for (var id in badges.badge_sets.subscriber.versions) {
                if (badges.badge_sets.subscriber.versions.hasOwnProperty(id)) {
                    
                    channelBadges.push(badges.badge_sets.subscriber.versions[id])
                }
            }

            // inverts the array for a rank-like style
            return channelBadges.reverse()
        }
    }
    return []
}

function isEmpty(obj) {
	for(var prop in obj) {
	  if(obj.hasOwnProperty(prop)) {
		return false;
	  }
	}
  
	return JSON.stringify(obj) === JSON.stringify({});
}