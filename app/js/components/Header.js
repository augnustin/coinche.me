import React, { useState, useMemo } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { Link } from "react-router-dom";
import "../../scss/components/header.scss";
import { undo, distribute, reset } from "../redux/actions/socketActions";
import { toggleIsLastTrickVisible } from "../redux/actions/localActions";
import { isArray, isFunction } from "../../../shared/utils/boolean";
import { selectCurrentPlayer, selectNbPlayers, selectTableId } from "../redux/selectors/game";
import Logo from "url:../../images/logo.png";

const Header = ({ currentPlayer, nbPlayers, distribute, undo, toggleIsLastTrickVisible, tableId, reset }) => {
  const [menuShown, showMenu] = useState(false);

  const toggleMenu = (e) => showMenu(!menuShown);

  const menu = useMemo(() => {
    const baseMenu = [
      {
        label: "Comment ça marche ?",
        to: "/help",
      },
      {
        label: "Paramètres",
        to: "/config",
      },
    ];

    if (tableId) {
      return baseMenu.concat([
        {
          label: "Partie en cours",
          to: `/game/${tableId}`,
          dropdown: [
            {
              label: "Revoir le dernier pli",
              onClick: (e) => {
                // toggleMenu();
                toggleIsLastTrickVisible();
              },
            },
            {
              label: "Annuler l'action précédente",
              onClick: (e) => undo(),
            },
            {
              label: "Redistribuer",
              onClick: (e) => {
                if (window.confirm("Es-tu sûr⸱e de vouloir abandonner la partie en cours ?")) {
                  distribute(currentPlayer?.id);
                }
              },
            },
            {
              label: "Hard reset : si tout est planté :(",
              onClick: (e) => {
                if (window.confirm("On repart à zéro ?")) {
                  // toggleMenu();
                  reset();
                }
              },
            },
          ],
        },
      ]);
    }

    return baseMenu;
  }, [tableId, currentPlayer?.id, distribute, undo, toggleIsLastTrickVisible, reset]);

  const renderMenuEntry = (entry, i) => {
    if (isArray(entry.dropdown)) {
      return (
        <div key={entry.label} className="navbar-item has-dropdown is-active">
          <Link to={entry.to} className="navbar-link is-arrowless">
            {entry.label}
          </Link>
          <div className="navbar-dropdown">{entry.dropdown.map(renderMenuEntry)}</div>
        </div>
      );
    }
    if (entry.divider) return <hr key={`divider-${i}`} className="navbar-divider" />;
    if (entry.to)
      return (
        <Link key={entry.label} className="navbar-item" to={entry.to}>
          {entry.label}
        </Link>
      );
    if (isFunction(entry.onClick))
      return (
        <a
          key={entry.label}
          className="navbar-item"
          onClick={(e) => {
            toggleMenu();
            entry.onClick();
          }}
        >
          {entry.label}
        </a>
      );
  };

  return (
    <nav className="navbar is-fixed-top is-spaced" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <Link to="/" className="navbar-item">
          <img src={Logo} alt="Coinche.me Logo" />
          <h1 className="is-hidden-mobile">Coinche.me</h1>
        </Link>

        <a
          onClick={toggleMenu}
          role="button"
          className={`navbar-burger burger ${menuShown ? "is-active" : ""}`}
          aria-label="menu"
          aria-expanded="false"
          data-target="navbarBasicExample"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
      <div className={`navbar-menu ${menuShown ? "is-active" : ""}`}>
        <div className="navbar-end">{menu.map(renderMenuEntry)}</div>
      </div>
    </nav>
  );
};

const mapStateToProps = createStructuredSelector({
  tableId: selectTableId,
  currentPlayer: selectCurrentPlayer,
  nbPlayers: selectNbPlayers,
});

const mapDispatchToProps = {
  distribute,
  undo,
  toggleIsLastTrickVisible,
  reset,
};

export default connect(mapStateToProps, mapDispatchToProps)(Header);
