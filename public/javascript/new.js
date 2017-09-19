 var a = 1;
  $("input[type='button']").on('click', function() { 
      if(a) {
          a = a + 1;
      }
      console.log(a);
      $('#add').append("<div class='form-group'><input class='form-control' type='text' name='voting[" +a+ "].[text]' placeholder='options...'></input></div>") 
  } ) 
