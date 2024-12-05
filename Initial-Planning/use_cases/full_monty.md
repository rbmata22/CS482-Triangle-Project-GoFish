# ***Full Monty***



## **Use Case - Sending Money to a Friend**

## **Primary Actor**
    1. User

## **Purpose**
As a user i want to be able to send money to my friend so that he can use my virtual currency

## **Stakeholders**
    1. User
    2. Selected Friend

## **Pre-Conditions**
    1. User must be a logged in user
    2. Friend must be a logged in user
    3. Friend must be added
    4. User must have currency

## **Post-Conditions**
    1. Users account must not be negative
    2. Selected Friend gets the users currency added to their account

## **Triggers**
User Input for...

    1. the amount
    2. to send it

## **Basic Flow/Main Success Scenario**

    1. User Signs Up / Logs into their account, 
    and are redirected to a home page.

    2. (Assuming User hasn't added friend, go to 
    Alternate Flow for other scenario)
    
    User clicks their "friends" tab and presses 
    "Add Friends"

    3. User inputs the username of the friend they want

    4. (On Friends End) Friend accepts the invite for
    in their "friend requests"

    5. Friend Accepts the requests

    6. (On Users End) User presses "Edit Friends" and
    clicks on the friends name

    7. User sends the money to the Friend

## **Alternate Flow/Extensions**

    1. User Signs Up / Logs into their account, 
    and are redirected to a home page.

    2. (Assuming User added Friend) User clicks their 
    "friends" tab and presses "Edit Friends"

    3. User clicks on the friends name

    4. User sends the money to the user
