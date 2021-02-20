import { BehaviorSubject } from 'rxjs';

export const getPortfolio = new BehaviorSubject(JSON.parse(localStorage.getItem('portfolio')));

export const setPortfolio = (portfolio) => {
    new BehaviorSubject(localStorage.setItem('portfolio', JSON.stringify(portfolio)));
}