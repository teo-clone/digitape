"use client"

import { useEffect, useState } from 'react';
import PlayerControls from './PlayerControls';
import Mixtape from './Mixtape';
import TrackInfo from './TrackInfo';

const Player: React.FC<{
    playlistId: string,
    accessToken: string
}> = ({ playlistId, accessToken }) => {

    const [player, setPlayer] = useState<Spotify.Player | undefined>(undefined);

    const [trackName, setTrackName] = useState('')
    const [artworkUrl, setArtworkUrl] = useState('')
    const [artists, setArtists] = useState<string[]>([]);
    const [paused, setPaused] = useState(false);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'Digitape Player 😈',
                getOAuthToken: cb => { cb(accessToken); },
                volume: 0.5
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }) => {
                console.log('Spotify web player is ready!');

                fetch(`/api/set-playlist?device_id=${device_id}&playlist_id=${playlistId}`)
                    .then(() => player.nextTrack()) // for shuffle / dev purposes
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.addListener('player_state_changed', (state => {
                if (!state || !state.track_window.current_track) {
                    return;
                }

                setTrackName(state.track_window.current_track.name);
                setArtworkUrl(state.track_window.current_track.album.images[0].url)

                setArtists(state.track_window.current_track.artists
                    .map((artist) => artist.name)
                    .filter((name: string) => !state.track_window.current_track.name.toLowerCase().includes(name.toLowerCase()))
                );
                setPaused(state.paused);

                player.getCurrentState().then(state => {
                    (!state) ? setActive(false) : setActive(true)
                });
            }));

            player.connect();

            return () => {
                player.disconnect();
            };
        }
    }, [])


    if (!player || !active) {
        return (
            <div className="text-8xl text-center flex h-[calc(100vh-100px)] items-center justify-center">
                SETTING THINGS UP ...
            </div>
        )
    }

    return (<>
        <div className="flex flex-col h-[calc(100vh-100px)] items-center justify-center gap-5">
            <Mixtape paused={paused} />

            <PlayerControls player={player} />
        </div>

        <div className="sticky bottom-0">
            <TrackInfo
                artworkUrl={artworkUrl}
                trackName={trackName}
                artists={artists}
            />
        </div>
    </>

    );
};

export default Player;