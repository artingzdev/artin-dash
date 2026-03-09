import { gridSpacesToPixels } from "../utils";

export const gameState = {
    screen: {
        width: 0,
        height: 0
    },

    player: {
        // effects
        ghostTrailOn: false,

        x: 0,
        y: 0,
        velocity: 0,
        flipGravity: false,

        gamemode: 0,
        miniMode: false,
        dualMode: false,

        attempts: 1,

        isDead: false,
        
        cube: {
            easeDuration: 75, // ms
            jumpIndex: 0,
            big: {
                _jumpDist: 136.32,
                //acceleration: 94.04
                //acceleration: 96.11, // blocks/s^2
                //acceleration: 2580, // units/s^2
                //acceleration: 2886, // units/s^2
                acceleration: null,
                terminalVelocity: 809.972, // units/s
                rotationSpeed: 415.83 // deg/s
            },
            mini: {
                rotationSpeed: 539.979 // deg/s
            }
        },
        ship: {
            easeDuration: 612 // ms
        }
    },

    settings: {

        groundID: "01", // 01 - 22
        backgroundID: "01", // 01 - 59
        middlegroundID: "00", // 00 - 03
        cubeID: "01",        

        backgroundSpeed: 0.1,
        middlegroundSpeedX: 0.3,
        middlegroundSpeedY: 0.5,

        gameSpeed: 1,
        songOffset: 0, // seconds
        fadeIn: false,
        fadeOut: false,
        reverseGameplay: false, // reverse trigger
        mirrorMode: false, // mirror portal
    },

    camera: {
        padding: 0.5,
        minY: null,

        followSpeed: 8.9,
        toY: null, // target Y position

        offset: 75 // units
    },

    triggers: [
        { // example (auto cleared in loadLevel())
            type: 'color',
            x: 375, // units
            red: 255,
            green: 255,
            blue: 255,
            duration: 500, // ms
            targetID: 1000,
            blending: false,
            opacity: 1,
            activated: false
        }
    ],

    levelDefaults: {
        settings: {
            backgroundID: "01",
            groundID: "01",
            middlegroundID: "00",

            backgroundSpeed: 0.1,
            middlegroundSpeedX: 0.3,
            middlegroundSpeedY: 0.5,

            gameSpeed: 1            
        },

        player: {
            gamemode: 0,
            flipGravity: false
        }
    }
};