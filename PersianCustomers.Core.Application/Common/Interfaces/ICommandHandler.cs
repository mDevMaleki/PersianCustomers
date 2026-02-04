using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;
using MediatR;

namespace PersianCustomers.Core.Application.Common.Interfaces
{
    public interface ICommandHandler<in TCommand> : IRequestHandler<TCommand>
    where TCommand : ICommand
    {
    }
    public interface ICommandHandler<in TCommand, TResponse> : IRequestHandler<TCommand, TResponse>
      where TCommand : ICommand<TResponse>
    {
    }
}
