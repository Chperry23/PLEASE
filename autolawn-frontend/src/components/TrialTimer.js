import React, { useEffect, useState } from 'react';

const TrialTimer = ({ trialEndDate }) => {
  const isValidDate = (date) => {
    return !isNaN(new Date(date).getTime());
  };

  const calculateTimeLeft = () => {
    if (!isValidDate(trialEndDate)) {
      return {};
    }

    const difference = +new Date(trialEndDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        Days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        Hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        Minutes: Math.floor((difference / 1000 / 60) % 60),
        Seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Cleanup
    return () => clearTimeout(timer);
  }, [trialEndDate]);

  const timerComponents = [];

  Object.keys(timeLeft).forEach(interval => {
    if (timeLeft[interval] === undefined || isNaN(timeLeft[interval])) {
      return;
    }

    timerComponents.push(
      <span key={interval}>
        {timeLeft[interval]} {interval}{" "}
      </span>
    );
  });

  return (
    <div style={styles.container}>
      {timerComponents.length ? (
        <div>
          <h3>Trial Ends In:</h3>
          <div style={styles.timer}>
            {timerComponents}
          </div>
        </div>
      ) : (
        <span>Your trial has ended.</span>
      )}
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    marginTop: '20px'
  },
  timer: {
    fontSize: '1.5em',
    fontWeight: 'bold'
  }
};

export default TrialTimer;
