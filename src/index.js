/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 * - Web service: communicate with an external web service to get tide data from NOAA CO-OPS API (http://tidesandcurrents.noaa.gov/api/)
 * - Multiple optional slots: has 2 slots (city and date), where the user can provide 0, 1, or 2 values, and assumes defaults for the unprovided values
 * - DATE slot: demonstrates date handling and formatted date responses appropriate for speech
 * - Custom slot type: demonstrates using custom slot types to handle a finite set of known values
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 *   If the user provides an incorrect slot in a one-shot model, it will direct to the dialog model. See the
 *   examples section for sample interactions of these models.
 * - Pre-recorded audio: Uses the SSML 'audio' tag to include an ocean wave sound in the welcome response.
 *
 * Examples:
 * One-shot model:
 *  User:  "Alexa, ask Tide Pooler when is the high tide in Seattle on Saturday"
 *  Alexa: "Saturday June 20th in Seattle the first high tide will be around 7:18 am,
 *          and will peak at ...""
 * Dialog model:
 *  User:  "Alexa, open Tide Pooler"
 *  Alexa: "Welcome to Tide Pooler. Which city would you like tide information for?"
 *  User:  "Seattle"
 *  Alexa: "For which date?"
 *  User:  "this Saturday"
 *  Alexa: "Saturday June 20th in Seattle the first high tide will be around 7:18 am,
 *          and will peak at ...""
 */

/**
 * App ID for the skill
 */
var APP_ID = "";//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var http = require('http');

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * YummlyRecipes is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var YummlyRecipes = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
YummlyRecipes.prototype = Object.create(AlexaSkill.prototype);
YummlyRecipes.prototype.constructor = YummlyRecipes;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

YummlyRecipes.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

YummlyRecipes.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

YummlyRecipes.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

/**
 * override intentHandlers to map intent handling functions.
 */
YummlyRecipes.prototype.intentHandlers = {
    "GetRecipesIntent": function (intent, session, response) {
        handleGetRecipesRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

// -------------------------- TidePooler Domain Specific Business Logic --------------------------

// example city to NOAA station mapping. Can be found on: http://tidesandcurrents.noaa.gov/map/
var FOOD = {
    'pasta',
    'soup',
    'rissoto',
    'fried rice',
    'cupcakes'
};

function handleWelcomeRequest(response) {
    var recipePrompt = "What would you like to cook today?",
        speechOutput = {
            speech: "<speak>Welcome to Yummly."
                + recipePrompt
                + "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech: "I can lead you through providing a food name "
                + "to get recipes for, "
                + "or you can simply open Yummly Recipes and ask a question like, "
                + "get recipes for banana nut cupcake"
                + recipePrompt,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.ask(speechOutput, repromptOutput);
}

function handleHelpRequest(response) {
    var repromptText = "What would you like to cook today?";
    var speechOutput = "I can lead you through providing a food name "
                + "to get recipes for, "
                + "or you can simply open Yummly Recipes and ask a question like, "
                + "get recipes for banana nut cupcake"
                + repromptText;

    response.ask(speechOutput, repromptText);
}

/**
 * Handles the case where the user asked or for, or is otherwise being with supported cities
 */
//Think abou using Yummly tabs (Just For You, Seasonal, Popular Now, Quick and Easy) 
// function handleFoodRequest(intent, session, response) {
//     // get city re-prompt
//     var repromptText = "Which food would you like recipes for?";
//     var speechOutput = "Some common examples are soups, pasta, sandwitch, rissoto, I know tide information for these coastal cities: " + getAllStationsText()
//         + repromptText;

//     response.ask(speechOutput, repromptText);
// }

/**
 * Handles the dialog step where the user provides a city
 */
// function handleCityDialogRequest(intent, session, response) {

//     var cityStation = getCityStationFromIntent(intent, false),
//         repromptText,
//         speechOutput;
//     if (cityStation.error) {
//         repromptText = "Currently, I know tide information for these coastal cities: " + getAllStationsText()
//             + "Which city would you like tide information for?";
//         // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
//         speechOutput = cityStation.city ? "I'm sorry, I don't have any data for " + cityStation.city + ". " + repromptText : repromptText;
//         response.ask(speechOutput, repromptText);
//         return;
//     }

//     // if we don't have a date yet, go to date. If we have a date, we perform the final request
//     if (session.attributes.date) {
//         getFinalTideResponse(cityStation, session.attributes.date, response);
//     } else {
//         // set city in session and prompt for date
//         session.attributes.city = cityStation;
//         speechOutput = "For which date?";
//         repromptText = "For which date would you like tide information for " + cityStation.city + "?";

//         response.ask(speechOutput, repromptText);
//     }
// }

/**
 * Handles the dialog step where the user provides a date
 */
// function handleDateDialogRequest(intent, session, response) {

//     var date = getDateFromIntent(intent),
//         repromptText,
//         speechOutput;
//     if (!date) {
//         repromptText = "Please try again saying a day of the week, for example, Saturday. "
//             + "For which date would you like tide information?";
//         speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

//         response.ask(speechOutput, repromptText);
//         return;
//     }

//     // if we don't have a city yet, go to city. If we have a city, we perform the final request
//     if (session.attributes.city) {
//         getFinalTideResponse(session.attributes.city, date, response);
//     } else {
//         // The user provided a date out of turn. Set date in session and prompt for city
//         session.attributes.date = date;
//         speechOutput = "For which city would you like tide information for " + date.displayDate + "?";
//         repromptText = "For which city?";

//         response.ask(speechOutput, repromptText);
//     }
// }

/**
 * Handle no slots, or slot(s) with no values.
 * In the case of a dialog based skill with multiple slots,
 * when passed a slot with no value, we cannot have confidence
 * it is the correct slot type so we rely on session state to
 * determine the next turn in the dialog, and reprompt.
 */
// function handleNoSlotDialogRequest(intent, session, response) {
//     if (session.attributes.city) {
//         // get date re-prompt
//         var repromptText = "Please try again saying a day of the week, for example, Saturday. ";
//         var speechOutput = repromptText;

//         response.ask(speechOutput, repromptText);
//     } else {
//         // get city re-prompt
//         handleSupportedCitiesRequest(intent, session, response);
//     }
// }

/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, open Tide Pooler and get tide information for Seattle on Saturday'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleGetRecipesRequest(intent, session, response) {

    // Determine city, using default if none provided
    var foodName = getFoodNameFromIntent(intent, true),
        repromptText,
        speechOutput;
    if (foodName.error) {
        // invalid food. move to the dialog
        repromptText = "Some popularly searched foods are: " + getAllFoodText()
            + "Which food would you like recipes for?";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = cityStation.city ? "I'm sorry, I don't have any data for what you asked." + repromptText : repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // all slots filled, either from the user or by default values. Move to final request
    getFinalRecipesResponse(foodName, response);
}

/**
 * Both the one-shot and dialog based paths lead to this method to issue the request, and
 * respond to the user with the final answer.
 */
function getFinalRecipesResponse(foodName, response) {

    // Issue the request, and respond to the user
    makeGetRecipesRequest(foodName.value, function recipesResponseCallback(err, recipesResponse) {
        var speechOutput;

        if (err) {
            speechOutput = "Sorry, the Yummly API service is experiencing a problem. Please try again later";
        } else {
            speechOutput = date.displayDate + " in " + cityStation.city + ", the first high tide will be around "
                + highTideResponse.firstHighTideTime + ", and will peak at about " + highTideResponse.firstHighTideHeight
                + ", followed by a low tide at around " + highTideResponse.lowTideTime
                + " that will be about " + highTideResponse.lowTideHeight
                + ". The second high tide will be around " + highTideResponse.secondHighTideTime
                + ", and will peak at about " + highTideResponse.secondHighTideHeight + ".";
        }

        response.tellWithCard(speechOutput, "YummlyRecipes", speechOutput)
    });
}

/**
 * Uses NOAA.gov API, documented: http://tidesandcurrents.noaa.gov/api/
 * Results can be verified at: http://tidesandcurrents.noaa.gov/noaatidepredictions/NOAATidesFacade.jsp?Stationid=[id]
 */
function makeGetRecipesRequest(food, recipesResponseCallback) {

    var datum = "MLLW";
    var endpoint = 'http://api.yummly.com/v1/api/recipes';
    var queryString = '?_app_id= f42c0863&_app_key=31c2264c90038cc55c7fd8a0ca8b5b59'
    queryString += '&q=' + food;
    
    http.get(endpoint + queryString, function (res) {
        var yummlyResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            recipesResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            yummlyResponseString += data;
        });

        res.on('end', function () {
            var yummlyResponseObject = JSON.parse(yummlyResponseString);

            if (yummlyResponseObject.error) {
                console.log("Yummly API error: " + yummlyResponseObject.error.message);
                recipesResponseCallback(new Error(yummlyResponseObject.error.message));
            } else {
                var recipeList = getFirstTenRecipes(yummlyResponseObject);
                recipesResponseCallback(null, recipeList);
            }
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        recipesResponseCallback(new Error(e.message));
    });
}

/**
 * Algorithm to find the 2 high tides for the day, the first of which is smaller and occurs
 * mid-day, the second of which is larger and typically in the evening
 */
// function findHighTide(noaaResponseObj) {
//     var predictions = noaaResponseObj.predictions;
//     var lastPrediction;
//     var firstHighTide, secondHighTide, lowTide;
//     var firstTideDone = false;

//     for (var i = 0; i < predictions.length; i++) {
//         var prediction = predictions[i];

//         if (!lastPrediction) {
//             lastPrediction = prediction;
//             continue;
//         }

//         if (isTideIncreasing(lastPrediction, prediction)) {
//             if (!firstTideDone) {
//                 firstHighTide = prediction;
//             } else {
//                 secondHighTide = prediction;
//             }

//         } else { // we're decreasing

//             if (!firstTideDone && firstHighTide) {
//                 firstTideDone = true;
//             } else if (secondHighTide) {
//                 break; // we're decreasing after have found 2nd tide. We're done.
//             }

//             if (firstTideDone) {
//                 lowTide = prediction;
//             }
//         }

//         lastPrediction = prediction;
//     }

//     return {
//         firstHighTideTime: alexaDateUtil.getFormattedTime(new Date(firstHighTide.t)),
//         firstHighTideHeight: getFormattedHeight(firstHighTide.v),
//         lowTideTime: alexaDateUtil.getFormattedTime(new Date(lowTide.t)),
//         lowTideHeight: getFormattedHeight(lowTide.v),
//         secondHighTideTime: alexaDateUtil.getFormattedTime(new Date(secondHighTide.t)),
//         secondHighTideHeight: getFormattedHeight(secondHighTide.v)
//     }
// }

// function isTideIncreasing(lastPrediction, currentPrediction) {
//     return parseFloat(lastPrediction.v) < parseFloat(currentPrediction.v);
// }

/**
 * Formats the height, rounding to the nearest 1/2 foot. e.g.
 * 4.354 -> "four and a half feet".
 */
// function getFormattedHeight(height) {
//     var isNegative = false;
//     if (height < 0) {
//         height = Math.abs(height);
//         isNegative = true;
//     }

//     var remainder = height % 1;
//     var feet, remainderText;

//     if (remainder < 0.25) {
//         remainderText = '';
//         feet = Math.floor(height);
//     } else if (remainder < 0.75) {
//         remainderText = " and a half";
//         feet = Math.floor(height);
//     } else {
//         remainderText = '';
//         feet = Math.ceil(height);
//     }

//     if (isNegative) {
//         feet *= -1;
//     }

//     var formattedHeight = feet + remainderText + " feet";
//     return formattedHeight;
// }

/**
 * Gets the city from the intent, or returns an error
 */
// function getCityStationFromIntent(intent, assignDefault) {

//     var citySlot = intent.slots.City;
//     // slots can be missing, or slots can be provided but with empty value.
//     // must test for both.
//     if (!citySlot || !citySlot.value) {
//         if (!assignDefault) {
//             return {
//                 error: true
//             }
//         } else {
//             // For sample skill, default to Seattle.
//             return {
//                 city: 'seattle',
//                 station: STATIONS.seattle
//             }
//         }
//     } else {
//         // lookup the city. Sample skill uses well known mapping of a few known cities to station id.
//         var cityName = citySlot.value;
//         if (STATIONS[cityName.toLowerCase()]) {
//             return {
//                 city: cityName,
//                 station: STATIONS[cityName.toLowerCase()]
//             }
//         } else {
//             return {
//                 error: true,
//                 city: cityName
//             }
//         }
//     }
// }

/**
 * Gets the date from the intent, defaulting to today if none provided,
 * or returns an error
 */
function getDateFromIntent(intent) {

    var foodSlot = intent.slots.Food;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!foodSlot || !foodSlot.value) {
        // default to today
        return {
            displayDate: "Today",
            requestDateParam: "q=pasta"
        }
    } else {

        var food = new String(foodSlot.value);

        var requestFood = "q=" + food;

        return {
            displayFood: food,
            requestDateParam: requestFood
        }
    }
}

// function getAllStationsText() {
//     var stationList = '';
//     for (var station in STATIONS) {
//         stationList += station + ", ";
//     }

//     return stationList;
// }

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var yummlyRecipes = new YummlyRecipes();
    yummlyRecipes.execute(event, context);
};

