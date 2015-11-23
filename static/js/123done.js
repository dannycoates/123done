;window.loggedInEmail = null

gapi.load(
  'auth2',
  function () {
    // initialize the auth api with our client_id provided by Google in their
    // dev console and restrict login to accounts on the mozilla hosted domain.
    // https://developers.google.com/identity/sign-in/web/devconsole-project
    //
    // client_id is set by <script src="/config">
    var auth2 = gapi.auth2.init(
      {
        client_id: client_id,
        hosted_domain: 'mozilla.com'
      }
    )
    // listen for sign-in state changes
    auth2.isSignedIn.listen(signInChanged)

    // listen for changes to current user
    auth2.currentUser.listen(userChanged)

    // wire up the Sign In button
    auth2.attachClickHandler(document.getElementById('signinbutton'))

    // wire up logout button
    $("#logout").click(
      function(ev) {
        ev.preventDefault()
        auth2.signOut()
      }
    )
  }
)

function signInChanged(signedIn) {
  console.log('signed in: ' + signedIn)
  if (!signedIn) {
    logout()
  }
}

function userChanged(user) {
  var id_token = user.getAuthResponse().id_token
  console.log('user changed: ' + id_token)
  if (id_token) {
    $.ajax({
      type: 'POST',
      url: '/api/auth', // this creates a cookie used to authenicate other api requests
      data: 'idtoken=' + id_token,
      contentType: 'application/x-www-form-urlencoded',
      dataType: 'json',
      success: updateUI,
      error: logout
    })
  }
  else {
    // this case triggers when the page is loaded and a user is not logged in
    updateUI()
  }
}

function logout() {
  // this deletes the session cookie created by /api/auth
  $.post('/api/logout')

  updateUI()

  // clear items from the dom at logout
  $("#todolist > li").remove()
  State.save()
  $("#dataState > div").css('display', 'none')
}

function updateUI(data) {
  // defaults to the welcome view when the user is logged out

  loggedInEmail = data ? data.email : null
  $("ul.loginarea li").css('display', 'none')
  if (loggedInEmail) {
    $('#loggedin span').text(loggedInEmail)
    $('#loggedin').css('display', 'block')
    $("#splash").hide()
    $("#lists").slideDown(500)
  } else {
    $('#loggedin span').text('')
    $('#loggedout').css('display', 'block')
    $("#splash").show()
    $("#lists").hide()

  }
  $("button").removeAttr('disabled').css('opacity', '1')

  // update list area
  $("section.todo ul").css('display', 'none')
  $("section.todo form").css('display', 'none')
  if (loggedInEmail) {
    $('#addform').css('display', 'block')
    $('#todolist').css('display', 'block')
    $('#donelist').css('display', 'block')
  } else {
    $('#signinhere').css('display', 'block')
  }

  // Load todos
  if (loggedInEmail) {
    State.load()
  }
}
