document.getElementById("calculating").onclick = function () {
    var ah = document.getElementById('ah').value;
    var voltage = document.getElementById('voltage').value;
    var capacity = ah * voltage;
    
    document.getElementById('powerCapacity').value = capacity;
}