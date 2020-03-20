import { HubConnectionBuilder, LogLevel } from '@aspnet/signalr'
var _ctx = undefined;
var _canvas = undefined;
var _connection = undefined; 
var _onNewBoard = undefined;

var _activeBoardId = "";
var _currentState = {};
var _strokeColor = "#FFFFFF";
var _lineType = 0;
var _isDrawing = false;
var _lineWidth = 2;

//////////////////////////////////////////////////////////////////////////
// Public functions
export function initWhiteboard(remoteHub, onNewBoard, canvas){
    
    _onNewBoard = onNewBoard;
    _canvas = canvas;

    _connection = new HubConnectionBuilder()
        .withUrl(remoteHub)    
        .configureLogging(LogLevel.Information)
        .build();

    _connection.start().then(function () {        
        console.log("connected");
        getBoardList();        
    });
        
    _connection.on("ReceiveUpdate", (update) => {    
        var boardUpdate = JSON.parse(update);
        if(boardUpdate.BoardId === _activeBoardId){
            drawBoardData(boardUpdate.Moves);
        }
    });
    
    _canvas.addEventListener("mousedown", onMouseDown, false);
    _canvas.addEventListener("mouseup", onMouseUp, false);
    _canvas.addEventListener("mousemove", onMouseMove, false);
    _ctx = _canvas.getContext("2d");    
}

export function setActiveBoardId(id){
    console.log("Loading board: " + id);    
    connectToWhiteboard(id);    
}
export function setLineWidth(value){    
    _lineWidth = parseInt(value, 10);
    console.log("Line width: " + value);      
}

export function setLineColor(color){
    _strokeColor = color;
    console.log("Line color: " + color);
}
//////////////////////////////////////////////////////////////////////////

function sendUpdateToServer(boardUpdate){
    console.log("Sending " + boardUpdate.Moves.length + " moves");
    _connection.invoke("UpdateBoard", JSON.stringify(boardUpdate))
        .catch(function (exception) {            
            console.error(exception.message);            
        });

    _currentState = createNewState();
}

function getMousePos(evt) {
    var rect = _canvas.getBoundingClientRect();
    return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
    };
}

async function connectToWhiteboard(id){    
    var boardData = JSON.parse(await _connection.invoke("ConnectToBoard", id)
        .catch(function (exception) {            
            console.error(exception.message);            
        }));
    
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    _activeBoardId = boardData.BoardId;
    _currentState = createNewState();
    
    if(id === '') {
        _onNewBoard(_activeBoardId);        
    }

    if(boardData.Moves.length > 0){
        console.log("Drawing " + boardData.Moves.length + " moves");
        drawBoardData(boardData.Moves);
    }
    console.info("boardId: " + _activeBoardId);
}

async function getBoardList(){
    console.log("Getting board list...");
    var raw = await _connection.invoke("GetBoardList");
    console.log(raw);
    var boardList = JSON.parse(raw);

    if(boardList.length > 0){
        boardList.forEach(board => {
            _onNewBoard(board);
        });
    }
    else{
        connectToWhiteboard('');
    }
}


//////////////////////////////////////////////////////////////////////////
// Mouse event handlers
function onMouseDown(e) {
    _isDrawing = true;    
    moveTo(e);    
}

function onMouseMove(e) {
    if(_isDrawing){    
        lineTo(e);            
        moveTo(e);        
    }
}

function onMouseUp(e) {
    _isDrawing = false;
    lineTo(e, true);
}    
//////////////////////////////////////////////////////////////////////////


function lineTo(e, forceSend = false){
    var pos = getMousePos(e);
    _ctx.lineTo(pos.x, pos.y);
    _ctx.strokeStyle = _strokeColor;
    _ctx.lineWidth = _lineWidth;
    _ctx.stroke();
    
    var currentMove = _currentState.Moves[_currentState.Moves.length - 1];
    currentMove.LineTo = { X: pos.x, Y: pos.y };        
    currentMove.Color = _strokeColor;        
    currentMove.LineWidth = _lineWidth;
    
    if(_currentState.Moves.length >= 20 || forceSend){            
        var boardUpdate = _currentState;
        boardUpdate.UpdateType = forceSend ? 1 : 0;
        sendUpdateToServer(boardUpdate);
        _currentState = createNewState();
    }
    console.log("Line to: " + pos.x + "," + pos.y);
}

function moveTo(e){
    var pos = getMousePos(e);    
    _ctx.beginPath();
    _ctx.moveTo(pos.x, pos.y);    
    _currentState.Moves.push({
        MoveTo: { X: pos.x, Y: pos.y }, 
        LineTo: {}, 
        Color: _strokeColor, 
        LineWidth: _lineWidth, 
        LineType: _lineType
    });    
    console.log("Move to: " + pos.x + "," + pos.y);
}

function drawBoardData(boardData){        
    boardData.forEach(move => {
        _ctx.beginPath();
        _ctx.moveTo(move.MoveTo.X, move.MoveTo.Y);
        _ctx.lineTo(move.LineTo.X, move.LineTo.Y);
        _ctx.strokeStyle = move.Color;
        _ctx.lineWidth = move.LineWidth;
        _ctx.stroke();      
    });    
}

function createNewState(){
    return {
        BoardId: _activeBoardId,
        User: "",
        UpdateType: 0,
        Moves: []
    };
}