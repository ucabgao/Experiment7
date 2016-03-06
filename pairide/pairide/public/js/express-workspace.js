var socket = connect();
var username = "";

$(document).ready(function(){

	if(!auth){
		/*Get user's name and load the session */
		$('#nameFormBtn').on("click", function(){
			username = $("#username").val();

			//Check if username is not already taken 
			//before assigning it.
			$.when(check_username(socket, "express", username)).
				then(function(duplicate){
					if(duplicate){
						$("#username").val('');
						$("#userModal .error").text('Sorry, this name is already taken.');
					}
					else{
						load(socket, "express", username);
						$('#userModal').modal('hide');	
					}
				});
			return false;
		});
		
	}
	else{
		load(socket, "express", username);
	}
});