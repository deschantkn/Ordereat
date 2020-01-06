const app = {};

app.config = {
  sessionToken: false,
};

app.stripeElements = undefined;
app.stripe = undefined;

app.request = {};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = (token) => {
  app.config.sessionToken = token;
  const tokenString = JSON.stringify(token);
  localStorage.setItem('token', tokenString);
};

app.request.createUser = async (method, path, payload, formId) => {
  // Call the API to create a new use.
  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (response.ok) {
    window.location = '/account/login';
  } else {
    const errorMessage = document.querySelector("#"+formId+" .formError");
    errorMessage.innerHTML = 'An error has occured. Try again';
    errorMessage.style.display = 'block';
  }
};

app.request.loginUser = async (method, path, payload, formId) => {
  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (response.ok) {
    const token = await response.json();
    app.setSessionToken(token)
    localStorage.setItem('redirectedToLogin', '0');
    window.location = '/account/menu';
  } else {
    const errorMessage = document.querySelector("#"+formId+" .formError");
    errorMessage.innerHTML = 'An error has occured. Please try again';
    errorMessage.style.display = 'block';
  }
};

app.loadPizzaPage = () => new Promise(async (resolve) => {
  const user = JSON.parse(localStorage.getItem('token'));
  // fetch pizza data
  const pizzaResponse = await fetch(`/api/menu?email=${user.email}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      token: user.id
    }
  });

  if (pizzaResponse.ok) {
    const { menu: pizzas } = await pizzaResponse.json();
    let pizzasHtml = '';
    for (let i = 0; i < pizzas.length; i++) {
      pizzasHtml += `
        <div class="pizza-card">
          <div class="pizza-img">
            <img src=${pizzas[i].image} alt="pizza image" />
          </div>
          <div class="pizza-info">
            <span><b>Name:</b> ${pizzas[i].name}</span>
            <span><b>Ingredients</b>: ${pizzas[i].ingredients.join(', ')}</span>
            <span><b>Price</b>: ${pizzas[i].price} rwf</span>
          </div>
          <div class="pizza-order-btn">
            <button id="${pizzas[i].id}" class="addToCart-btn">Add To Cart</button>
          </div>
        </div>
      `
    }
    const menuPage = document.querySelector('.pizza__main .pizza-menu');
    if (menuPage) {
      menuPage.innerHTML = pizzasHtml;
      resolve();
    }
  } else if (pizzaResponse.status === 403 || pizzaResponse.status === 401) {
    app.config.sessionToken = false;
    localStorage.removeItem('token');
    window.location = '/account/login';
  }
});

app.initStripeForm = () => {
  app.stripe = Stripe('pk_test_ZGQ9o3WeR302CyWGTottdg1F');
  app.stripeElements = app.stripe.elements();
};

app.stripeTokenHandler = async (token) => {
  // Insert the token ID into the form so it gets submitted to the server
  // const form = document.getElementById('payment-form');
  // const hiddenInput = document.createElement('input');
  // hiddenInput.setAttribute('type', 'hidden');
  // hiddenInput.setAttribute('name', 'stripeToken');
  // hiddenInput.setAttribute('value', token.id);
  // form.appendChild(hiddenInput);
  // // Submit the form
  // form.submit();

  // Use fetch api to make request
  const user = JSON.parse(localStorage.getItem('token'));
  const response = await fetch('/api/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: user.id
    },
    body: JSON.stringify({
      email: user.email,
      cardToken: token.id
    }),
  });
  if (response.ok) {
    alert('Pizza ordered!, you will receive a receipt in your mail');
  }
}

app.handleStripeForm = () => {
  const cardStyle = {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  };

  // Create an instance of the card Element.
  const card = app.stripeElements.create('card', {cardStyle});

  // Add an instance of the card Element into the `card-element` <div>.
  card.mount('#card-element');

  // Handle real-time validation errors from the card Element.
  card.addEventListener('change', (event) => {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
      displayError.textContent = event.error.message;
    } else {
      displayError.textContent = '';
    }
  });

  // Handle form submission.
  const stripeForm = document.getElementById('payment-form');
  stripeForm.addEventListener('submit', (event) => {
    event.preventDefault();

    app.stripe.createToken(card).then((result) => {
      if (result.error) {
        // Inform the user if there was an error.
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = result.error.message;
      } else {
        // Send the token to your server.
        app.stripeTokenHandler(result.token);
      }
    });
  });
};

app.bindForms = (formId) => {
  const form = document.querySelector(formId);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { id: formId, action, method } = e.target;
    const formElements = e.target.elements
    let payload = {};

   if (document.querySelector("#"+formId+" .formError")) {
    document.querySelector("#"+formId+" .formError").style.display = 'none';
   }
  
    for (let i = 0; i < formElements.length; i++) {
      payload[formElements[i].name] = formElements[i].value;
    }

    // call the right form submission handler based on the form id
    switch (formId) {
      case 'user-signup':
        app.request.createUser(method.toUpperCase(), action, payload, formId);
        break;
      case 'user-login':
        app.request.loginUser(method.toUpperCase(), action, payload, formId);
        break;
      default:
        break;
    }
  });
};

app.resetToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    app.config.sessionToken = JSON.parse(token);
    const loggedInOnlyElements = document.querySelectorAll('header .menu .loggedIn');
    const loggedOutOnlyElements = document.querySelectorAll('header .menu .loggedOut');

    for (let i = 0; i < loggedInOnlyElements.length; i++) {
      loggedInOnlyElements[i].style.display = 'block';
    }
    for (let i = 0; i < loggedOutOnlyElements.length; i++) {
      loggedOutOnlyElements[i].style.display = 'none';
    }
  } else {
    app.config.sessionToken = false;
    localStorage.removeItem("token");
  }
};

app.loadUserCart = async () => {
  // fetch cart
  const user = JSON.parse(localStorage.getItem('token'));
  if (typeof user === 'object') {
    // call api to add pizza to cart
    const response = await fetch(`/api/cart?email=${user.email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        token: user.id
      }
    });

    if (response.ok) {
      const { cartData: cart, cartTotal: total} = await response.json();
      let cartRows = '';
      const cartTotalRow = `
        <th style="text-align: left;">Total:</th>
        <td>${total}</td>
      `;
    
      for (let i = 0; i < cart.length; i++) {
        cartRows += `
          <tr>
            <td>${cart[i].name}</td>
            <td>${cart[i].price}</td>
          </tr>
        `;
      }

      const cartTable = document.querySelector('#order-item');
      const cartTotal = document.querySelector('#order-total');
      if (cartTable && cartTotal) {
        cartTable.innerHTML = cartRows;
        cartTotal.innerHTML = cartTotalRow;
      }
    }
    
  } else {
    app.config.sessionToken = false;
    localStorage.removeItem("token");
    window.location = '/account/login';
  }
};

app.addToCart = async (pizzaId) => {
  const user = JSON.parse(localStorage.getItem('token'));
  if (typeof user === 'object') {
    // call api to add pizza to cart
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: user.id
      },
      body: JSON.stringify({ pizzaId: Number(pizzaId), email: user.email })
    });

    if (response.ok) {
      alert('Pizza was added to your cart!');
    }
    
  } else {
    app.config.sessionToken = false;
    localStorage.removeItem("token");
    window.location = '/account/login';
  }
};

app.logUserOut = async () => {
  const user = JSON.parse(localStorage.getItem('token'));
  if (typeof user === 'object') {
    // call api to add pizza to cart
    const response = await fetch(`/api/logout?email=${user.email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        token: user.id
      }
    });

    if (response.ok) {
      app.config.sessionToken = false;
      localStorage.removeItem("token");
      window.location = '/';
    }
  }
}

// Init (bootstrapping)
app.init = async () => {
  if (document.querySelector('form')) {
    const formId = document.querySelector('form').getAttribute('id');
    app.bindForms(`#${formId}`);
  }

  if (document.querySelector('#payment-form') && localStorage.getItem('token')) {
    app.initStripeForm();
    app.handleStripeForm();
  } else if (document.querySelector('#payment-form') && !localStorage.getItem('token')) {
    window.location = '/account/login';
  }

  if (document.querySelector('main.pizza__main') && localStorage.getItem('token')) {
    await app.loadPizzaPage()

    // bind to all cart buttons
    const addButtons = document.querySelectorAll('.addToCart-btn');
    for (let i = 0; i < addButtons.length; i++) {
      addButtons[i].addEventListener('click', () => app.addToCart(addButtons[i].id));
    }
  } else if (document.querySelector('main.pizza__main') && !localStorage.getItem('token')) {
    window.location = '/account/login';
  }

  if (document.querySelector('.cart__main') && localStorage.getItem('token')) {
    app.loadUserCart();
  } else if (document.querySelector('.cart__main') && !localStorage.getItem('token')) {
    window.location = '/account/login';
  }

  if (document.querySelector('header #logout-link')) {
    document.querySelector('header #logout-link').addEventListener('click', () => {
      app.logUserOut();
    });
  }

  // Reset token from local storage after page reloads
  app.resetToken();
};

// Call the init processes after the window loads
window.onload = function() {
  app.init();
};
