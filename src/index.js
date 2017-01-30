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

// example of some food items
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
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, open Yummly Recipes and get recipes for information for Seattle on Saturday'.
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
 * Uses Yummly Recipes Web API
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

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var yummlyRecipes = new YummlyRecipes();
    yummlyRecipes.execute(event, context);
};

