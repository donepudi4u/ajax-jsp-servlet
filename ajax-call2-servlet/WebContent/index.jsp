<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
	pageEncoding="ISO-8859-1"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>Sample Servlet</title>
<script type="text/javascript" src="js/jquery-1.7.2.min.js"> </script>

<script type="text/javascript">
$(document).ready(function(){
	$('#submitFirstForm').click(function(){
		var data = {
				foo : $('#name').val(),
				bar : $('#gender').val(),
				baz : $('#age').val()
			};

			$.ajax({
				type : "POST",
				url : "SampleServlet",
				contentType : "application/json", // NOT dataType!
				data : JSON.stringify(data),
				success : function(result) {
					$('#result1').html(result);
				}
			});
	});
	$('#submitSecondForm').click(function (){
		var data = {
				foo : $('#name').val(),
				bar : $('#gender').val(),
				baz : $('#age').val()
			};
		$.ajax({
			type : "POST",
			url : "SampleSecondServlet",
			contentType : "application/json",
			data : JSON.stringify(data),
			success : function(result) {
				$('#result2').html(result);
			}
			
		});
		
	});
	
});
</script>

</head>
<body>
	<form>
		<br/>
		Name : <input type="text" id="name" /> 
		<br/>
		Title : Male <input type="radio" id="gender" value="male"> : Female <input type="radio" name="gender" value="Female">
		<br/> 
		Age : <input type="text" id="age">
		<br/>
		<br/> 
		<input type="button" id="submitFirstForm" name="Submit" value="submit" title="Submit Details">
		Hello : <span id="result1"></span>
		<br/>
		<input type="button" id="submitSecondForm" name="submitSecondForm" value="submit-2" title="Submit Details-2">
		Hello2 : <span id="result2"></span>
	</form>

</body>
</html>